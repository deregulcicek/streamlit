/**
 * Copyright (c) Streamlit Inc. (2018-2022) Snowflake Inc. (2022-2024)
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

import { StyledWidgetLabel } from "@streamlit/lib/src/components/widgets/BaseWidget/styled-components"
import { Metric as MetricProto } from "@streamlit/lib/src/proto"
import { LabelVisibilityOptions } from "@streamlit/lib/src/util/utils"

export interface StyledMetricContainerProps {
  showBorder: boolean
}

export const StyledMetricContainer = styled.div<StyledMetricContainerProps>(
  ({ theme, showBorder }) => ({
    ...(showBorder && {
      border: `${theme.sizes.borderWidth} solid ${theme.colors.borderColor}`,
      borderRadius: theme.radii.default,
      padding: `calc(${theme.spacing.lg} - ${theme.sizes.borderWidth})`,
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    }),
  })
)
export interface StyledMetricLabelTextProps {
  visibility?: LabelVisibilityOptions
}

export const StyledTruncateText = styled.div(({ theme }) => ({
  overflowWrap: "normal",
  textOverflow: "ellipsis",
  width: "100%",
  overflow: "hidden",
  whiteSpace: "nowrap",
  fontFamily: theme.genericFonts.bodyFont,
  lineHeight: "normal",
  verticalAlign: "middle",

  // Styles to truncate the text inside the StyledStreamlitMarkdown div.
  "& > div": {
    overflow: "hidden",

    "& > p": {
      textOverflow: "ellipsis",
      overflow: "hidden",
    },
  },
}))

export const StyledMetricLabelText = styled(
  StyledWidgetLabel
)<StyledMetricLabelTextProps>(({ visibility }) => ({
  marginBottom: 0,
  display: visibility === LabelVisibilityOptions.Collapsed ? "none" : "grid",
  gridTemplateColumns:
    visibility === LabelVisibilityOptions.Collapsed ? "initial" : "auto 1fr",
  visibility:
    visibility === LabelVisibilityOptions.Hidden ? "hidden" : "visible",
}))

export const StyledMetricValueText = styled.div(({ theme }) => ({
  fontSize: theme.fontSizes.twoXL,
  color: theme.colors.bodyText,
  paddingBottom: theme.spacing.twoXS,
  fontWeight: theme.fontWeights.bold,
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing.sm,
  width: "fit-content",
}))

export interface StyledMetricDeltaTextProps {
  metricColor: MetricProto.MetricColor
}

const getMetricColor = (
  theme: any,
  color: MetricProto.MetricColor
): string => {
  switch (color) {
    case MetricProto.MetricColor.RED:
      return theme.colors.red80
    case MetricProto.MetricColor.GREEN:
      return theme.colors.green80
    // this must be grey
    default:
      return theme.colors.metricNeutralDeltaColor
  }
}

export const StyledMetricDeltaText = styled.div<StyledMetricDeltaTextProps>(
  ({ theme, metricColor }) => ({
    color: getMetricColor(theme, metricColor),
    fontSize: theme.fontSizes.sm,
    display: "inline-flex",
    flexDirection: "row",
    alignItems: "center",
    fontWeight: theme.fontWeights.normal,
    backgroundColor:
      metricColor === MetricProto.MetricColor.GREEN
        ? "rgba(45, 200, 65, 0.1)"
        : metricColor === MetricProto.MetricColor.RED
        ? "rgba(255, 65, 50, 0.1)"
        : theme.colors.secondaryBackgroundColor,
    padding: `${theme.spacing.threeXS} ${theme.spacing.sm}`,
    borderRadius: "1rem",
  })
)
