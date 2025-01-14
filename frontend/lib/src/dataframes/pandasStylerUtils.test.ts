import { describe, expect, test, vi } from "vitest"
import { Quiver } from "./Quiver"
import { getStyledCell, getStyledHeaders } from "./pandasStylerUtils"

const T_FAKE_UUID = "T_FAKE_UUID"

describe("getStyledHeaders", () => {
  test("returns correct headers for single-level headers", () => {
    const mockQuiver = new Quiver({} as any)
    vi.spyOn(mockQuiver, "dimensions", "get").mockReturnValue({
      numHeaderRows: 1,
      numIndexColumns: 1,
      numDataRows: 0,
      numDataColumns: 0,
      numRows: 1,
      numColumns: 2,
    })
    vi.spyOn(mockQuiver, "columnNames", "get").mockReturnValue([
      ["col1", "col2"],
    ])

    const headers = getStyledHeaders(mockQuiver)
    expect(headers).toEqual([
      [
        { name: "", cssClass: "blank index_name" },
        { name: "col1", cssClass: "col_heading level0 col0" },
        { name: "col2", cssClass: "col_heading level0 col1" },
      ],
    ])
  })

  test("returns correct headers for multi-level headers", () => {
    const mockQuiver = new Quiver({} as any)
    vi.spyOn(mockQuiver, "dimensions", "get").mockReturnValue({
      numHeaderRows: 2,
      numIndexColumns: 2,
      numDataRows: 0,
      numDataColumns: 0,
      numRows: 2,
      numColumns: 4,
    })
    vi.spyOn(mockQuiver, "columnNames", "get").mockReturnValue([
      ["top1", "top2"],
      ["sub1", "sub2"],
    ])

    const headers = getStyledHeaders(mockQuiver)
    expect(headers).toEqual([
      [
        { name: "", cssClass: "blank index_name" },
        { name: "", cssClass: "blank index_name level0" },
        { name: "top1", cssClass: "col_heading level0 col0" },
        { name: "top2", cssClass: "col_heading level0 col1" },
      ],
      [
        { name: "", cssClass: "blank index_name" },
        { name: "", cssClass: "blank index_name level1" },
        { name: "sub1", cssClass: "col_heading level1 col0" },
        { name: "sub2", cssClass: "col_heading level1 col1" },
      ],
    ])
  })

  test("handles empty data", () => {
    const mockQuiver = new Quiver({} as any)
    vi.spyOn(mockQuiver, "dimensions", "get").mockReturnValue({
      numHeaderRows: 1,
      numIndexColumns: 1,
      numDataRows: 0,
      numDataColumns: 0,
      numRows: 1,
      numColumns: 1,
    })
    vi.spyOn(mockQuiver, "columnNames", "get").mockReturnValue([[]])

    const headers = getStyledHeaders(mockQuiver)
    expect(headers).toEqual([[{ name: "", cssClass: "blank index_name" }]])
  })
})

describe("getStyledCell", () => {
  test("returns undefined when no styler is present", () => {
    const mockQuiver = new Quiver({} as any)
    vi.spyOn(mockQuiver, "dimensions", "get").mockReturnValue({
      numHeaderRows: 1,
      numIndexColumns: 1,
      numDataRows: 2,
      numDataColumns: 2,
      numRows: 3,
      numColumns: 3,
    })
    vi.spyOn(mockQuiver, "styler", "get").mockReturnValue(undefined)

    const cell = getStyledCell(mockQuiver, 0, 1)
    expect(cell).toBeUndefined()
  })

  test("returns correct styling for index cells", () => {
    const mockQuiver = new Quiver({} as any)
    vi.spyOn(mockQuiver, "dimensions", "get").mockReturnValue({
      numHeaderRows: 1,
      numIndexColumns: 2,
      numDataRows: 3,
      numDataColumns: 2,
      numRows: 4,
      numColumns: 4,
    })
    vi.spyOn(mockQuiver, "styler", "get").mockReturnValue({
      cssId: T_FAKE_UUID,
    } as any)

    const cell = getStyledCell(mockQuiver, 1, 0)
    expect(cell).toEqual({
      cssId: `${T_FAKE_UUID}level0_row1`,
      cssClass: "row_heading level0 row1",
      displayContent: undefined,
    })
  })

  test("returns correct styling for data cells", () => {
    const mockQuiver = new Quiver({} as any)
    vi.spyOn(mockQuiver, "dimensions", "get").mockReturnValue({
      numHeaderRows: 1,
      numIndexColumns: 1,
      numDataRows: 3,
      numDataColumns: 2,
      numRows: 4,
      numColumns: 3,
    })
    vi.spyOn(mockQuiver, "styler", "get").mockReturnValue({
      cssId: T_FAKE_UUID,
      displayValues: {
        getCell: (row: number, col: number) => ({ content: `${row},${col}` }),
      },
    } as any)

    const cell = getStyledCell(mockQuiver, 1, 2)
    expect(cell).toEqual({
      cssId: `${T_FAKE_UUID}row1_col1`,
      cssClass: "data row1 col1",
      displayContent: "1,2",
    })
  })

  test("throws error for out of range row index", () => {
    const mockQuiver = new Quiver({} as any)
    vi.spyOn(mockQuiver, "dimensions", "get").mockReturnValue({
      numHeaderRows: 1,
      numIndexColumns: 1,
      numDataRows: 2,
      numDataColumns: 2,
      numRows: 3,
      numColumns: 3,
    })
    vi.spyOn(mockQuiver, "styler", "get").mockReturnValue({
      cssId: T_FAKE_UUID,
    } as any)

    expect(() => getStyledCell(mockQuiver, 2, 1)).toThrow(
      "Row index is out of range: 2"
    )
  })

  test("throws error for out of range column index", () => {
    const mockQuiver = new Quiver({} as any)
    vi.spyOn(mockQuiver, "dimensions", "get").mockReturnValue({
      numHeaderRows: 1,
      numIndexColumns: 1,
      numDataRows: 2,
      numDataColumns: 2,
      numRows: 3,
      numColumns: 3,
    })
    vi.spyOn(mockQuiver, "styler", "get").mockReturnValue({
      cssId: T_FAKE_UUID,
    } as any)

    expect(() => getStyledCell(mockQuiver, 0, 3)).toThrow(
      "Column index is out of range: 3"
    )
  })
})
