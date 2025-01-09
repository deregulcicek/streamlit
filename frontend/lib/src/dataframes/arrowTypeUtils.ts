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

import { Dictionary, Field, Struct, StructRow, Vector } from "apache-arrow"

import { isNullOrUndefined } from "@streamlit/lib/src/util/utils"

enum ColumnDataKind {
  Empty,
  Boolean,
  Integer,
  Float,
  String,
  Date,
  Datetime,
  Time,
  List,
  Period,
  Interval,
  Timedelta,
  Decimal,
  Bytes,
  Dict,
  Categorical,
  Unknown,
}

/** Data types used by ArrowJS. */
export type DataType =
  | null
  | boolean
  | number
  | string
  | Date // datetime
  | Int32Array // int
  | Uint8Array // bytes
  | Uint32Array // Decimal
  | Vector // arrays
  | StructRow // interval
  | Dictionary // categorical
  | Struct // dict
  | bigint // period

export enum PandasIndexTypeName {
  CategoricalIndex = "categorical",
  DatetimeIndex = "datetime",
  Float64Index = "float64",
  Int64Index = "int64",
  RangeIndex = "range",
  UInt64Index = "uint64",
  UnicodeIndex = "unicode",

  // Throws an error.
  TimedeltaIndex = "time",
}

/** Pandas type information for single-index columns, and data columns. */
export interface PandasColumnType {
  /** The Arrow field that corresponds to the column. */
  field?: Field

  /** The type label returned by pandas.api.types.infer_dtype */
  pandas_type?: PandasIndexTypeName | string

  /** The numpy dtype that corresponds to the types returned in df.dtypes */
  numpy_type?: string

  /** Type metadata. */
  meta?: Record<string, any> | null
}

/** Metadata for the "range" index type. */
export interface PandasRangeIndex {
  kind: "range"
  name: string | null
  start: number
  step: number
  stop: number
}

/**
 * Converts an Arrow vector to a list of strings.
 *
 * @param vector The Arrow vector to convert.
 * @returns The list of strings.
 */
export function convertVectorToList(vector: Vector<any>): string[] {
  const values = []

  for (let i = 0; i < vector.length; i++) {
    values.push(vector.get(i))
  }
  return values
}

/** True if the index name represents a "range" index. */
export function isRangeIndex(
  indexName: string | PandasRangeIndex
): indexName is PandasRangeIndex {
  return typeof indexName === "object" && indexName.kind === "range"
}

/** Returns type for a single-index column or data column. */
export function getTypeName(
  type: PandasColumnType
): PandasIndexTypeName | string {
  if (type.pandas_type === undefined || type.numpy_type === undefined) {
    return String(type.field?.type)
  }

  // For `PeriodType` and `IntervalType` types are kept in `numpy_type`,
  // for the rest of the indexes in `pandas_type`.
  return type.pandas_type === "object" ? type.numpy_type : type.pandas_type
}

/** True if both arrays contain the same data types in the same order. */
export function sameDataTypes(
  t1: PandasColumnType[],
  t2: PandasColumnType[]
): boolean {
  // NOTE: We remove extra columns from the DataFrame that we add rows from.
  // Thus, as long as the length of `t2` is >= than `t1`, this will work properly.
  // For columns, `pandas_type` will point us to the correct type.
  return t1.every(
    (type: PandasColumnType, index: number) =>
      type.pandas_type === t2[index]?.pandas_type
  )
}

/** True if both arrays contain the same index types in the same order. */
export function sameIndexTypes(
  t1: PandasColumnType[],
  t2: PandasColumnType[]
): boolean {
  // Make sure both indexes have same dimensions.
  if (t1.length !== t2.length) {
    return false
  }

  return t1.every(
    (type: PandasColumnType, index: number) =>
      index < t2.length && getTypeName(type) === getTypeName(t2[index])
  )
}

/** Returns the timezone of the arrow type metadata. */
export function getTimezone(arrowType: PandasColumnType): string | undefined {
  // Get timezone from pandas metadata, and if not available, use the Arrow field.
  return arrowType?.meta?.timezone ?? arrowType?.field?.type?.timezone
}

/** True if the arrow type is an integer type.
 * For example: int8, int16, int32, int64, uint8, uint16, uint32, uint64, range
 */
export function isIntegerType(type?: PandasColumnType): boolean {
  if (isNullOrUndefined(type)) {
    return false
  }
  const typeName = getTypeName(type) ?? ""
  return (
    (typeName.startsWith("int") && !typeName.startsWith("interval")) ||
    typeName === "range" ||
    typeName.startsWith("uint")
  )
}

/** True if the arrow type is an unsigned integer type. */
export function isUnsignedIntegerType(type?: PandasColumnType): boolean {
  if (isNullOrUndefined(type)) {
    return false
  }
  const typeName = getTypeName(type) ?? ""
  return typeName.startsWith("uint")
}

/** True if the arrow type is a float type.
 * For example: float16, float32, float64, float96, float128
 */
export function isFloatType(type?: PandasColumnType): boolean {
  if (isNullOrUndefined(type)) {
    return false
  }
  const typeName = getTypeName(type) ?? ""
  return typeName.startsWith("float")
}

/** True if the arrow type is a decimal type. */
export function isDecimalType(type?: PandasColumnType): boolean {
  if (isNullOrUndefined(type)) {
    return false
  }
  return getTypeName(type) === "decimal"
}

/** True if the arrow type is a numeric type. */
export function isNumericType(type?: PandasColumnType): boolean {
  if (isNullOrUndefined(type)) {
    return false
  }
  return isIntegerType(type) || isFloatType(type) || isDecimalType(type)
}

/** True if the arrow type is a boolean type. */
export function isBooleanType(type?: PandasColumnType): boolean {
  if (isNullOrUndefined(type)) {
    return false
  }
  return getTypeName(type) === "bool"
}

export function determineColumnKind(arrowType: Type): ColumnDataKind {
  const typeName = getTypeName(arrowType) ?? ""
  const field = arrowType.field
  const extensionName = field && field.metadata.get("ARROW:extension:name")

  if (["unicode", "empty", "large_string[pyarrow]"].includes(typeName)) {
    return ColumnDataKind.String
  }

  if (typeName?.startsWith("datetime")) {
    return ColumnDataKind.Datetime
  }

  if (typeName === "time") {
    return ColumnDataKind.Time
  }

  if (typeName === "date") {
    return ColumnDataKind.Date
  }

  if (typeName === "bytes") {
    return ColumnDataKind.Bytes
  }

  if (typeName === "bool") {
    return ColumnDataKind.Boolean
  }

  if (
    ["float16", "float32", "float64", "float96", "float128"].includes(typeName)
  ) {
    return ColumnDataKind.Float
  }

  if (
    [
      "int8",
      "int16",
      "int32",
      "int64",
      "uint8",
      "uint16",
      "uint32",
      "uint64",
      "range", // The default index in pandas uses a range type.
    ].includes(typeName)
  ) {
    return ColumnDataKind.Integer
  }

  if (typeName === "decimal") {
    return ColumnDataKind.Decimal
  }

  if (typeName === "categorical") {
    return ColumnDataKind.Categorical
  }

  if (typeName?.startsWith("period") || extensionName === "pandas.period") {
    return ColumnDataKind.Period
  }

  if (typeName?.startsWith("interval")) {
    return ColumnDataKind.Interval
  }

  if (typeName?.startsWith("timedelta")) {
    return ColumnDataKind.Timedelta
  }

  if (typeName.startsWith("list")) {
    return ColumnDataKind.List
  }

  return ColumnDataKind.Unknown
}
