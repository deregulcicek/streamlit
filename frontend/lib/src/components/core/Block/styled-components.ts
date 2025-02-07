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

import React, { CSSProperties } from "react"

import styled from "@emotion/styled"

import { Block as BlockProto } from "@streamlit/protobuf"

import { StyledCheckbox } from "~lib/components/widgets/Checkbox/styled-components"
import { EmotionTheme, STALE_STYLES } from "~lib/theme"
import { assertNever } from "~lib/util/assertNever"

function translateGapWidth(gap: string, theme: EmotionTheme): string {
  let gapWidth = theme.spacing.lg
  if (gap === "medium") {
    gapWidth = theme.spacing.threeXL
  } else if (gap === "large") {
    gapWidth = theme.spacing.fourXL
  }
  return gapWidth
}

const getAlignItems = (
  align: BlockProto.Horizontal.Align | BlockProto.Vertical.Align | null
): CSSProperties["alignItems"] => {
  switch (align) {
    case BlockProto.Horizontal.Align.ALIGN_START:
    case BlockProto.Vertical.Align.ALIGN_START:
      return "start"
    case BlockProto.Horizontal.Align.ALIGN_CENTER:
    case BlockProto.Vertical.Align.ALIGN_CENTER:
      return "center"
    case BlockProto.Horizontal.Align.ALIGN_END:
    case BlockProto.Vertical.Align.ALIGN_END:
      return "end"
    case BlockProto.Horizontal.Align.STRETCH:
    case BlockProto.Vertical.Align.STRETCH:
      return "stretch"
    case BlockProto.Horizontal.Align.BASELINE:
    case BlockProto.Vertical.Align.BASELINE:
      return "baseline"
    case null:
      // This is the existing default behavior
      return "stretch"
    default:
      assertNever(align)
  }
}

const getJustifyContent = (
  justify: BlockProto.Horizontal.Justify | null
): CSSProperties["justifyContent"] => {
  switch (justify) {
    case BlockProto.Horizontal.Justify.JUSTIFY_START:
    case BlockProto.Vertical.Justify.JUSTIFY_START:
      return "start"
    case BlockProto.Horizontal.Justify.JUSTIFY_CENTER:
    case BlockProto.Vertical.Justify.JUSTIFY_CENTER:
      return "center"
    case BlockProto.Horizontal.Justify.JUSTIFY_END:
    case BlockProto.Vertical.Justify.JUSTIFY_END:
      return "end"
    case BlockProto.Horizontal.Justify.SPACE_AROUND:
      case BlockProto.Vertical.Justify.SPACE_AROUND:
      return "space-around"
    case BlockProto.Horizontal.Justify.SPACE_BETWEEN:
      case BlockProto.Vertical.Justify.SPACE_BETWEEN:
      return "space-between"
    case BlockProto.Horizontal.Justify.SPACE_EVENLY:
    case BlockProto.Vertical.Justify.SPACE_EVENLY:
      return "space-evenly"
    case null:
      // This is the existing default behavior
      return undefined
    default:
      assertNever(justify)
  }
}

export interface StyledHorizontalBlockProps {
  gap: string
  align: BlockProto.Horizontal.Align | null
  justify: BlockProto.Horizontal.Justify | null
  wrap: boolean
}

export const StyledHorizontalBlock = styled.div<StyledHorizontalBlockProps>(
  ({ theme, gap, justify, align, wrap }) => {
    const gapWidth = translateGapWidth(gap, theme)

    return {
      // While using flex for columns, padding is used for large screens and gap
      // for small ones. This can be adjusted once more information is passed.
      // More information and discussions can be found: Issue #2716, PR #2811
      display: "flex",
      flexGrow: 1,
      gap: gapWidth,
      alignItems: getAlignItems(align),
      justifyContent: getJustifyContent(justify),
      flexWrap: wrap ? "wrap" : "nowrap",
    }
  }
)

export interface StyledElementContainerProps {
  isStale: boolean
  width: number | string | undefined
  flex: number | string | undefined
  elementType: string
}

const GLOBAL_ELEMENTS = ["balloons", "snow"]
export const StyledElementContainer = styled.div<StyledElementContainerProps>(
  ({ theme, isStale, width, flex, elementType }) => ({
    width,
    flex,
    // Allows to have absolutely-positioned nodes inside app elements, like
    // floating buttons.
    position: "relative",

    "@media print": {
      overflow: "visible",
    },

    ":is(.stHtml-empty)": {
      display: "none",
    },

    ":has(> .stCacheSpinner)": {
      height: theme.spacing.none,
      overflow: "visible",
      visibility: "visible",
      marginBottom: `-${theme.spacing.lg}`,
      zIndex: theme.zIndices.cacheSpinner,
    },

    ":has(> .stPageLink)": {
      marginTop: `-${theme.spacing.xs}`,
      marginBottom: `-${theme.spacing.xs}`,
    },

    ...(isStale && elementType !== "skeleton" && STALE_STYLES),
    ...(elementType === "empty"
      ? {
          // Use display: none for empty elements to avoid the flexbox gap.
          display: "none",
        }
      : {}),
    ...(GLOBAL_ELEMENTS.includes(elementType)
      ? {
          // Global elements are rendered in their delta position, but they
          // are not part of the flexbox layout. We apply a negative margin
          // to remove the flexbox gap. display: none does not work for these,
          // since they needs to be visible.
          marginBottom: `-${theme.spacing.lg}`,
        }
      : {}),
  })
)

interface StyledColumnProps {
  weight: number
  gap: string
  showBorder: boolean
  verticalAlignment?: BlockProto.Column.VerticalAlignment
}

export const StyledColumn = styled.div<StyledColumnProps>(
  ({ theme, weight, gap, showBorder, verticalAlignment }) => {
    const { VerticalAlignment } = BlockProto.Column
    const percentage = weight * 100
    const gapWidth = translateGapWidth(gap, theme)
    const width = `calc(${percentage}% - ${gapWidth})`

    return {
      // Calculate width based on percentage, but fill all available space,
      // e.g. if it overflows to next row.
      width,
      flex: `1 1 ${width}`,

      [`@media (max-width: ${theme.breakpoints.columns})`]: {
        minWidth: `calc(100% - ${theme.spacing.twoXL})`,
      },
      ...(verticalAlignment === VerticalAlignment.BOTTOM && {
        marginTop: "auto",
        // Add margin to the first checkbox/toggle within the column to align it
        // better with other input widgets.
        [`& ${StyledElementContainer}:last-of-type > ${StyledCheckbox}`]: {
          marginBottom: theme.spacing.sm,
        },
      }),
      ...(verticalAlignment === VerticalAlignment.TOP && {
        // Add margin to the first checkbox/toggle within the column to align it
        // better with other input widgets.
        [`& ${StyledElementContainer}:first-of-type > ${StyledCheckbox}`]: {
          marginTop: theme.spacing.sm,
        },
      }),
      ...(verticalAlignment === VerticalAlignment.CENTER && {
        marginTop: "auto",
        marginBottom: "auto",
      }),
      ...(showBorder && {
        border: `${theme.sizes.borderWidth} solid ${theme.colors.borderColor}`,
        borderRadius: theme.radii.default,
        padding: `calc(${theme.spacing.lg} - ${theme.sizes.borderWidth})`,
      }),
    }
  }
)

export interface StyledVerticalBlockProps {
  ref?: React.RefObject<any>
  width?: number | string
  align: BlockProto.Vertical.Align | BlockProto.Horizontal.Align | null
  justify: BlockProto.Vertical.Justify | BlockProto.Horizontal.Justify | null
  wrap: boolean
  gap: string | null
}

export const StyledVerticalBlock = styled.div<StyledVerticalBlockProps>(
  ({ width, theme, align, justify, wrap, gap }) => {
    const gapWidth = gap ? translateGapWidth(gap, theme) : theme.spacing.lg

    return {
      width,
      position: "relative", // Required for the automatic width computation.
      display: "flex",
      flex: 1,
      flexDirection: "column",
      gap: gapWidth,
      alignItems: getAlignItems(align),
      justifyContent: getJustifyContent(justify),
      flexWrap: wrap ? "wrap" : "nowrap",
    }
  }
)

export const StyledVerticalBlockWrapper = styled.div({
  display: "flex",
  flexDirection: "column",
  flex: 1,
})

export interface StyledVerticalBlockBorderWrapperProps {
  border: boolean
  height?: number
}

export const StyledVerticalBlockBorderWrapper =
  styled.div<StyledVerticalBlockBorderWrapperProps>(
    ({ theme, border, height }) => ({
      ...(border && {
        border: `${theme.sizes.borderWidth} solid ${theme.colors.borderColor}`,
        borderRadius: theme.radii.default,
        padding: `calc(${theme.spacing.lg} - ${theme.sizes.borderWidth})`,
      }),
      ...(height && {
        height: `${height}px`,
        overflow: "auto",
      }),
    })
  )
