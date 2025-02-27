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
  align: BlockProto.FlexContainer.Align | undefined
): CSSProperties["alignItems"] => {
  switch (align) {
    case BlockProto.FlexContainer.Align.ALIGN_START:
      return "start"
    case BlockProto.FlexContainer.Align.ALIGN_CENTER:
      return "center"
    case BlockProto.FlexContainer.Align.ALIGN_END:
      return "end"
    case BlockProto.FlexContainer.Align.STRETCH:
      return "stretch"
    case undefined:
      // This is the existing default behavior
      return "start"
    default:
      assertNever(align)
  }
}

const getJustifyContent = (
  justify: BlockProto.FlexContainer.Justify | undefined
): CSSProperties["justifyContent"] => {
  switch (justify) {
    case BlockProto.FlexContainer.Justify.JUSTIFY_START:
      return "start"
    case BlockProto.FlexContainer.Justify.JUSTIFY_CENTER:
      return "center"
    case BlockProto.FlexContainer.Justify.JUSTIFY_END:
      return "end"
    case BlockProto.FlexContainer.Justify.SPACE_BETWEEN:
      return "space-between"
    case undefined:
      // This is the existing default behavior
      return "start"
    default:
      assertNever(justify)
  }
}

export interface StyledHorizontalBlockProps {
  gap: string
}

export const StyledHorizontalBlock = styled.div<StyledHorizontalBlockProps>(
  ({ theme, gap }) => {
    const gapWidth = translateGapWidth(gap, theme)

    return {
      // While using flex for columns, padding is used for large screens and gap
      // for small ones. This can be adjusted once more information is passed.
      // More information and discussions can be found: Issue #2716, PR #2811
      display: "flex",
      flexGrow: 1,
      gap: gapWidth,
    }
  }
)

export interface StyledElementContainerProps {
  isStale: boolean
  flex?: number | string | undefined
  width: React.CSSProperties["width"]
  maxWidth?: React.CSSProperties["maxWidth"]
  elementType: string
}

const GLOBAL_ELEMENTS = ["balloons", "snow"]
export const StyledElementContainer = styled.div<StyledElementContainerProps>(
  ({ theme, isStale, width, elementType, maxWidth, flex }) => ({
    width,
    maxWidth,
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
  width?: React.CSSProperties["width"]
  maxWidth?: React.CSSProperties["maxWidth"]
}

export const StyledVerticalBlock = styled.div<StyledVerticalBlockProps>(
  ({ width, maxWidth, theme }) => {
    return {
      width,
      maxWidth,
      position: "relative", // Required for the automatic width computation.
      display: "flex",
      flex: 1,
      flexDirection: "column",
      gap: theme.spacing.lg,
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

export interface StyledFlexContainerWrapperProps {
  ref?: React.RefObject<any>
  flexDirection: React.CSSProperties["flexDirection"]
  align?: BlockProto.FlexContainer.Align
  justify?: BlockProto.FlexContainer.Justify
  wrap: boolean
  gap?: string
}

export const StyledFlexContainerWrapper =
  styled.div<StyledFlexContainerWrapperProps>(
    ({ flexDirection, align, justify, wrap, gap, theme }) => {
      const gapWidth = gap ? translateGapWidth(gap, theme) : theme.spacing.lg
      return {
        display: "flex",
        flex: 1,
        flexDirection: flexDirection,
        alignItems: getAlignItems(align),
        justifyContent: getJustifyContent(justify),
        flexWrap: wrap ? "wrap" : "nowrap",
        gap: gapWidth,
      }
    }
  )
