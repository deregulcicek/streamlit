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

import { Quiver } from "./Quiver"

export interface StyledHeader {
  name: string
  cssClass: string
}

export interface StyledCell {
  /** The cell's CSS id, if the DataFrame has Styler. */
  cssId: string
  /** The cell's CSS class. */
  cssClass: string
  /** The cell's formatted content string, if the DataFrame was created with a Styler. */
  displayContent: string | undefined
}

/**
 * Returns a row-major matrix of styled index & column header names
 * from the provided Quiver object. It returns names as well as
 * css classes to match the pandas styling.
 *
 * This is a matrix (multidimensional array) to support multi-level headers.
 */
export function getStyledHeaders(data: Quiver): StyledHeader[][] {
  const { numHeaderRows, numIndexColumns } = data.dimensions

  // Create a matrix to hold all headers
  const headers: StyledHeader[][] = []

  // For each header row
  for (let rowIndex = 0; rowIndex < numHeaderRows; rowIndex++) {
    const headerRow: StyledHeader[] = []

    // Add blank cells for index columns in header rows
    for (let colIndex = 0; colIndex < numIndexColumns; colIndex++) {
      const cssClasses = ["blank", "index_name"]
      if (colIndex > 0) {
        cssClasses.push(`level${rowIndex}`)
      }
      headerRow.push({
        name: "",
        cssClass: cssClasses.join(" "),
      })
    }

    // Add data column headers
    for (
      let colIndex = 0;
      colIndex < data.columnNames[rowIndex]?.length || 0;
      colIndex++
    ) {
      // Column label cells include:
      // - col_heading
      // - col<n> where n is the numeric position of the column
      // - level<k> where k is the level in a MultiIndex
      headerRow.push({
        name: data.columnNames[rowIndex][colIndex],
        cssClass: `col_heading level${rowIndex} col${colIndex}`,
      })
    }

    headers.push(headerRow)
  }

  return headers
}

export function getStyledCell(
  data: Quiver,
  rowIndex: number,
  columnIndex: number
): StyledCell | undefined {
  if (!data.styler || !data.styler.cssId) {
    return undefined
  }

  const { numIndexColumns, numDataRows, numColumns } = data.dimensions

  if (rowIndex < 0 || rowIndex >= numDataRows) {
    throw new Error(`Row index is out of range: ${rowIndex}`)
  }
  if (columnIndex < 0 || columnIndex >= numColumns) {
    throw new Error(`Column index is out of range: ${columnIndex}`)
  }

  const isIndexCell = columnIndex < numIndexColumns

  if (isIndexCell) {
    // Index label cells include:
    // - row_heading
    // - row<n> where n is the numeric position of the row
    // - level<k> where k is the level in a MultiIndex
    const cssClass = [
      `row_heading`,
      `level${columnIndex}`,
      `row${rowIndex}`,
    ].join(" ")

    return {
      cssId: `${data.styler.cssId}level${columnIndex}_row${rowIndex}`,
      cssClass,
      displayContent: undefined,
    }
  }

  const dataColumnIndex = columnIndex - numIndexColumns

  // Data cells include `data`.
  const cssClass = ["data", `row${rowIndex}`, `col${dataColumnIndex}`].join(
    " "
  )

  const displayContent = data.styler?.displayValues
    ? (data.styler.displayValues.getCell(rowIndex, columnIndex)
        .content as string)
    : undefined

  return {
    cssId: `${data.styler.cssId}row${rowIndex}_col${dataColumnIndex}`,
    cssClass: cssClass,
    displayContent,
  }
}
