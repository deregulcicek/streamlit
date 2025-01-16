/**
 * Copyright (c) Streamlit Inc. (2018-2022) Snowflake Inc. (2022-2025)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Utility functions used by Quiver to parse arrow data from IPC bytes.
 */

import {
  Schema as ArrowSchema,
  Dictionary,
  Field,
  Int,
  Null,
  Table,
  tableFromIPC,
  Vector,
} from "apache-arrow"
import range from "lodash/range"
import unzip from "lodash/unzip"

import {
  isNullOrUndefined,
  notNullOrUndefined,
} from "@streamlit/lib/src/util/utils"

import {
  convertVectorToList,
  PandasColumnType,
  PandasRangeIndex,
  PandasRangeIndexType,
} from "./arrowTypeUtils"

/**
 * Index data value.
 */
type IndexValue = Vector | number[]

/**
 * A row-major matrix of DataFrame index data values.
 */
export type IndexData = IndexValue[]

/**
 * A row-major matrix of DataFrame column header names.
 * This is a matrix (multidimensional array) to support multi-level headers.
 *
 * NOTE: ArrowJS automatically formats the columns in schema, i.e. we always get strings.
 */
export type ColumnNames = string[][]

/**
 * A row-major grid of DataFrame data.
 */
export type Data = Table

/** A DataFrame's index and data column (pandas) types. */
export interface PandasColumnTypes {
  /** Types for each index column. */
  index: PandasColumnType[]

  /** Types for each data column. */
  data: PandasColumnType[]
}

/**
 * Pandas metadata extracted from an Arrow table.
 * This describes a single column (either index or data column).
 * It needs to exactly match the structure used in the JSON
 * representation of the Pandas schema in the Arrow table.
 */
interface PandasColumnMetadata {
  /**
   * The fieldName of the column.
   * For a single-index column, this is just the name of the column (e.g. "foo").
   * For a multi-index column, this is a stringified tuple (e.g. "('1','foo')")
   */
  field_name: string

  /**
   * Column-specific metadata. Only used by certain column types
   * (e.g. CategoricalIndex has `num_categories`.)
   */
  metadata: Record<string, any> | null

  /** The name of the column. */
  name: string | null

  /**
   * The type of the column. When `pandas_type == "object"`, `numpy_type`
   * will have a more specific type.
   */
  pandas_type: string

  /**
   * When `pandas_type === "object"`, this field contains the object type.
   * If pandas_type has another value, numpy_type is ignored.
   */
  numpy_type: string
}

/**
 * The Pandas schema extracted from an Arrow table.
 * Arrow stores the schema as a JSON string, and we parse it into this typed object.
 * The Pandas schema is only present if the Arrow table was processed through Pandas.
 */
interface PandasSchema {
  /**
   * The DataFrame's index names (either provided by user or generated,
   * guaranteed unique). It is used to fetch the index data. Each DataFrame has
   * at least 1 index. There are many different index types; for most of them
   * the index name is stored as a string, but for the "range" index a `RangeIndex`
   * object is used. A `RangeIndex` is only ever by itself, never as part of a
   * multi-index. The length represents the dimensions of the DataFrame's index grid.
   *
   * Example:
   * Range index: [{ kind: "range", name: null, start: 1, step: 1, stop: 5 }]
   * Other index types: ["__index_level_0__", "foo", "bar"]
   */
  index_columns: (string | PandasRangeIndex)[]

  /**
   * Schemas for each column (index *and* data columns) in the DataFrame.
   */
  columns: PandasColumnMetadata[]

  /**
   * DataFrame column headers.
   * The length represents the dimensions of the DataFrame's columns grid.
   */
  column_indexes: PandasColumnMetadata[]
}

/** True if the index name represents a "range" index.
 *
 * This is only needed for parsing.
 */
function isPandasRangeIndex(
  indexName: string | PandasRangeIndex
): indexName is PandasRangeIndex {
  return typeof indexName === "object" && indexName.kind === "range"
}

/**
 * Parse the Pandas schema that is embedded as JSON string in the Arrow table.
 * This is only present if the table was processed through Pandas.
 */
function parsePandasSchema(table: Table): PandasSchema | undefined {
  const schema = table.schema.metadata.get("pandas")
  if (isNullOrUndefined(schema)) {
    // No Pandas schema found. This happens if the dataset
    // did not touched Pandas during serialization.
    return undefined
  }
  return JSON.parse(schema)
}

/** Parse DataFrame's index data values. */
function parseIndexData(table: Table, pandasSchema?: PandasSchema): IndexData {
  if (!pandasSchema) {
    // No Pandas schema found. This happens if the dataset
    // did not touche Pandas during serialization.
    return []
  }

  return pandasSchema.index_columns
    .map(indexCol => {
      if (isPandasRangeIndex(indexCol)) {
        // Range index is not part of the arrow data. Therefore,
        // we need to generate the range index data manually:
        const { start, stop, step } = indexCol
        return range(start, stop, step)
      }

      // Otherwise, use the index name to get the index column data.
      const column = table.getChild(indexCol as string)
      if (column instanceof Vector && column.type instanceof Null) {
        return null
      }
      return column
    })
    .filter(
      (column: IndexValue | null): column is IndexValue => column !== null
    )
}

/**
 * Parse a header name into a list of strings
 *
 * For a single-level header, the name is returned as a list with a single string.
 * For a multi-level header, the name is parsed into a list of strings.
 *
 * Example:
 * "('1','foo')" -> ["1", "foo"]
 * "foo" -> ["foo"]
 */
function parseHeaderName(name: string, numLevels: number): string[] {
  if (numLevels === 1) {
    return [name]
  }

  try {
    return JSON.parse(
      name.replace(/\(/g, "[").replace(/\)/g, "]").replace(/'/g, '"')
    )
  } catch (e) {
    // Add empty strings for the missing levels
    return [...Array(numLevels - 1).fill(""), name]
  }
}
/** Parse DataFrame's column header names. */
function parseColumnNames(
  arrowDataTypes: ArrowType[],
  arrowIndexTypes: ArrowType[],
  pandasSchema?: PandasSchema
): ColumnNames {
  const allArrowTypes = arrowIndexTypes.concat(arrowDataTypes)

  // Perform the following transformation:
  // ["('1','foo')", "('2','bar')", "('3','baz')"] -> ... -> [["1", "2", "3"], ["foo", "bar", "baz"]]
  return unzip(
    allArrowTypes
      .map(type =>
        !type.arrowField.name.startsWith("__index_level_")
          ? type.arrowField.name
          : ""
      )
      .map(fieldName =>
        // If DataFrame `columns` has multi-level indexing, the length of
        // `column_indexes` will show how many levels there are.
        parseHeaderName(fieldName, pandasSchema?.column_indexes.length ?? 1)
      )
  )
}

/** Parse DataFrame's non-index data into a Table object. */
function parseData(table: Table, arrowDataTypes: ArrowType[]): Data {
  const numDataRows = table.numRows
  const numDataColumns = arrowDataTypes.length
  if (numDataRows === 0 || numDataColumns === 0) {
    return table.select([])
  }
  const dataColumnNames = arrowDataTypes.map(type => type.arrowField.name)
  return table.select(dataColumnNames)
}

/** The type of the cell. */
export enum DataFrameCellType {
  // Index cells
  INDEX = "index",
  // Data cells
  DATA = "data",
}

/** Metadata for a single column in a DataFrame. */
export interface ArrowType {
  /** The cell's type (index or data). */
  type: DataFrameCellType

  /** The Arrow field metadata of the column. */
  arrowField: Field

  /** The pandas type metadata of the column. */
  pandasType: PandasColumnMetadata | undefined

  /** If the column is categorical, this contains a list of categorical
   * options. Otherwise, it is undefined.
   */
  categoricalOptions?: string[]
}

/** Parsed Arrow table split into different components for easier access. */
interface ParsedTable {
  /** All index data cells. */
  indexData: IndexData

  /** All data cells. */
  data: Data

  /** All column names. */
  columnNames: ColumnNames

  /** Type information for index columns. */
  arrowIndexTypes: ArrowType[]

  /** Type information for data columns. */
  arrowDataTypes: ArrowType[]
}

/** Parse type information for index columns.
 *
 * Index columns are only present if the dataframe was processed through Pandas.
 */
function parseIndexColumnTypes(
  schema: ArrowSchema,
  pandasSchema: PandasSchema | undefined,
  categoricalOptions: Record<string, string[]>
): ArrowType[] {
  if (!pandasSchema) {
    // Index columns are only present if the table was processed through Pandas.
    return []
  }

  const arrowIndexTypes: ArrowType[] = pandasSchema.index_columns.map(
    indexCol => {
      if (isPandasRangeIndex(indexCol)) {
        // Range indices are not part of the arrow schema, so we need to
        // create a new field with the correct type information manually:
        const indexName = indexCol.name || ""
        return {
          type: DataFrameCellType.INDEX,
          arrowField: new Field(indexName, new Int(true, 64), true),
          pandasType: {
            field_name: indexName,
            name: indexName,
            pandas_type: PandasRangeIndexType,
            numpy_type: PandasRangeIndexType,
            metadata: indexCol as PandasRangeIndex,
          },
        }
      }

      // Find the corresponding field in the arrow schema
      const field = schema.fields.find(f => f.name === indexCol)
      if (!field) {
        // This should never happen since the arrow schema should always contain
        // the index fields
        throw new Error(`Index field ${indexCol} not found in arrow schema`)
      }

      return {
        type: DataFrameCellType.INDEX,
        arrowField: field,
        pandasType: pandasSchema.columns.find(
          column => column.field_name === indexCol
        ),
        categoricalOptions: categoricalOptions[field.name],
      }
    }
  )

  return arrowIndexTypes
}

/** Parse type information for data columns. */
function parseDataColumnTypes(
  schema: ArrowSchema,
  pandasSchema: PandasSchema | undefined,
  categoricalOptions: Record<string, string[]>
): ArrowType[] {
  const dataFields = schema.fields.filter(field =>
    pandasSchema ? !pandasSchema.index_columns.includes(field.name) : true
  )

  const arrowDataTypes: ArrowType[] = dataFields.map(field => {
    return {
      type: DataFrameCellType.DATA,
      arrowField: field,
      pandasType: pandasSchema?.columns.find(
        column => column.field_name === field.name
      ),
      categoricalOptions: categoricalOptions[field.name],
    }
  })

  return arrowDataTypes
}

/** Parse categorical options for each column that has a categorical type. */
function parseCategoricalOptions(table: Table): Record<string, string[]> {
  const categoricalOptions: Record<string, string[]> = {}
  table.schema.fields.forEach((field, index) => {
    if (field.type instanceof Dictionary) {
      const categoricalDict = table.getChildAt(index)?.data[0]?.dictionary
      if (notNullOrUndefined(categoricalDict)) {
        categoricalOptions[field.name] = convertVectorToList(categoricalDict)
      }
    }
  })
  return categoricalOptions
}

/**
 * Parse Arrow bytes (IPC format).
 *
 * @param ipcBytes - Arrow bytes (IPC format)
 * @returns - Parsed Arrow table split into different
 *  components for easier access: columnNames, fields, indexData, indexNames, data, columnTypes.
 */
export function parseArrowIpcBytes(
  ipcBytes: Uint8Array | null | undefined
): ParsedTable {
  // Load arrow table object from IPC data
  const table = tableFromIPC(ipcBytes)

  // Load pandas schema from metadata (if it exists):
  const pandasSchema = parsePandasSchema(table)

  // Load categorical options for each column that has a categorical type:
  const categoricalOptions = parseCategoricalOptions(table)

  // Load Arrow types for index columns:
  const arrowIndexTypes = parseIndexColumnTypes(
    table.schema,
    pandasSchema,
    categoricalOptions
  )

  // Load Arrow types for data columns:
  const arrowDataTypes = parseDataColumnTypes(
    table.schema,
    pandasSchema,
    categoricalOptions
  )

  // Load all non-index data cells:
  const data = parseData(table, arrowDataTypes)

  // Load all index data cells:
  const indexData = parseIndexData(table, pandasSchema)

  // Load all index & data column names as a matrix:
  const columnNames = parseColumnNames(
    arrowDataTypes,
    arrowIndexTypes,
    pandasSchema
  )

  return {
    indexData,
    data,
    columnNames,
    arrowIndexTypes,
    arrowDataTypes,
  }
}
