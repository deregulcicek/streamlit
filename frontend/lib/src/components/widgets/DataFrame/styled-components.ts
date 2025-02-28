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

import styled from "@emotion/styled"

export interface StyledResizableContainerProps {
  hasCustomizedScrollbars: boolean
}

/**
 * A resizable data grid container component.
 */
export const StyledResizableContainer =
  styled.div<StyledResizableContainerProps>(
    ({ hasCustomizedScrollbars, theme }) => ({
      position: "relative",
      display: "inline-block",

      "& .stDataFrameGlideDataEditor": {
        height: "100%",
        minWidth: "100%",
        borderRadius: theme.radii.default,
      },

      "& .dvn-scroller": {
        // We only want to configure scrollbar aspects for browsers that
        // don't support custom scrollbars (e.g. Firefox). Also, applying this
        // in Chrome causes the scrollbar to change to the default scrollbar style.
        ...(!hasCustomizedScrollbars && { scrollbarWidth: "thin" }),
        ["overflowX" as any]: "auto !important",
        ["overflowY" as any]: "auto !important",
      },
      "& .gdg-seveqep": {
        // Make the search field more responsive to the grid width and use
        // rem units for everything.
        // 19rem is the closest rem withou decimals to the original size:
        maxWidth: "19rem",
        width: "80%",
        // 6rem was manually determined as the smallest size thats still somewhat usuable:
        minWidth: "6rem",
        top: theme.spacing.sm,
        right: theme.spacing.sm,
        padding: theme.spacing.sm,
        borderRadius: theme.radii.default,
        "& .gdg-search-status": {
          paddingTop: theme.spacing.twoXS,
          fontSize: theme.fontSizes.twoSm,
        },
        "& .gdg-search-progress": {
          // We are disabling the search progress bar since it
          // looks a bit weired in its current state and doesn't work
          // with rounded corners
          display: "none",
        },
        "& input": {
          width: "100%",
        },
        "& button": {
          width: theme.iconSizes.xl,
          height: theme.iconSizes.xl,
          "& .button-icon": {
            width: theme.iconSizes.base,
            height: theme.iconSizes.base,
          },
        },
      },
    })
  )
