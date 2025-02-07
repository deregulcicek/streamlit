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

import React, {
  memo,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react"

import { BokehChart as BokehChartProto } from "@streamlit/protobuf"

// We import Bokeh from a vendored source file, because it doesn't play well with Babel (https://github.com/bokeh/bokeh/issues/10658)
// Importing these files will cause global Bokeh to be mutated
// Consumers of this component will have to provide these js files
// bokeh.esm is renamed from bokeh-2.4.3.esm.min.js because addon bokeh scripts have hardcoded path to bokeh main script ("import main from “./bokeh.esm.js")
import Bokeh from "~lib/vendor/bokeh/bokeh.esm"
import "~lib/vendor/bokeh/bokeh-api-2.4.3.esm.min"
import "~lib/vendor/bokeh/bokeh-gl-2.4.3.esm.min"
import "~lib/vendor/bokeh/bokeh-mathjax-2.4.3.esm.min"
import "~lib/vendor/bokeh/bokeh-tables-2.4.3.esm.min"
import "~lib/vendor/bokeh/bokeh-widgets-2.4.3.esm.min"

//#region Manual types for Bokeh types
interface BokehPlot {
  type: string
  attributes: {
    plot_width: number
    plot_height: number
  }
}

interface BokehData {
  doc?: {
    roots?: {
      references?: BokehPlot[]
    }
  }
}
//#endregion

const removeAllChildNodes = (element: Node): void => {
  while (element.lastChild) {
    element.lastChild.remove()
  }
}

export interface BokehChartProps {
  width: number
  element: BokehChartProto
  height?: number
}

interface Dimensions {
  chartWidth: number
  chartHeight: number
}

export function BokehChart({
  width,
  element,
  height,
}: Readonly<BokehChartProps>): ReactElement {
  const chartId = `bokeh-chart-${element.elementId}`

  const chartData = useMemo<BokehData>(() => {
    return JSON.parse(element.figure)
  }, [element.figure])

  const getChartDimensions = useCallback(
    (plot: BokehPlot): Dimensions => {
      // Default values
      let chartWidth: number = plot.attributes.plot_width
      let chartHeight: number = plot.attributes.plot_height

      // if is not fullscreen and useContainerWidth==false, we should use default values
      if (height) {
        chartWidth = width
        chartHeight = height
      } else if (element.useContainerWidth) {
        chartWidth = width
      }

      return { chartWidth, chartHeight }
    },
    [element.useContainerWidth, height, width]
  )

  /**
   * updateIdRef helps prevent race conditions when multiple updates are
   * triggered in quick succession. Since Bokeh's embed_item is asynchronous, a
   * newer update could complete before an older one, which would result in
   * multiple Bokeh charts being rendered. By tracking the most recent update
   * ID, we ensure only the latest update's results are displayed.
   */
  const updateIdRef = useRef(0)
  const chartRef = useRef<HTMLDivElement>(null)

  const updateChart = useCallback(
    (data: BokehData, updateId: number): void => {
      if (!chartRef.current) {
        return
      }

      /**
       * When you create a bokeh chart in your python script, you can specify
       * the width: p = figure(title="simple line example", x_axis_label="x", y_axis_label="y", plot_width=200);
       * In that case, the json object will contains an attribute called
       * plot_width (or plot_heigth) inside the plot reference.
       * If that values are missing, we can set that values to make the chart responsive.
       */
      const plot = data?.doc?.roots?.references?.find(
        (e: BokehPlot) => e.type === "Plot"
      )

      if (plot) {
        const { chartWidth, chartHeight } = getChartDimensions(plot)
        if (chartWidth > 0) {
          plot.attributes.plot_width = chartWidth
        }
        if (chartHeight > 0) {
          plot.attributes.plot_height = chartHeight
        }
      }

      removeAllChildNodes(chartRef.current)

      Bokeh.embed.embed_item(data, chartId).then(() => {
        // Only keep this update if it's still the most recent
        if (updateId !== updateIdRef.current && chartRef.current) {
          removeAllChildNodes(chartRef.current)
        }
      })
    },
    [chartId, getChartDimensions]
  )

  useEffect(() => {
    updateIdRef.current += 1
    const currentUpdateId = updateIdRef.current

    if (!chartRef.current) {
      return
    }

    const cleanup = (): void => {
      if (chartRef.current) {
        removeAllChildNodes(chartRef.current)
      }
    }

    updateChart(chartData, currentUpdateId)

    return cleanup
  }, [width, height, element, chartData, updateChart])

  return (
    <div
      ref={chartRef}
      id={chartId}
      className="stBokehChart"
      data-testid="stBokehChart"
    />
  )
}

export default memo(BokehChart)
