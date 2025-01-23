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

import { useContext, useMemo } from "react"

import { Block as BlockProto } from "@streamlit/protobuf"

import { FlexContext } from "~lib/components/core/Flex/FlexContext"
import { assertNever } from "~lib/util/assertNever"

export type UseLayoutStylesArgs<T> = {
  width: number | undefined
  element:
    | (T & {
        width?: number
        useContainerWidth?: boolean | null
        flex?: string
        justifyRight?: boolean
      })
    | undefined
}

const { Align } = BlockProto.Horizontal

const isNonZeroPositiveNumber = (value: unknown): value is number =>
  typeof value === "number" && value > 0 && !isNaN(value)

export type UseLayoutStylesShape = {
  width: React.CSSProperties["width"]
  flex?: React.CSSProperties["flex"]
  overflowX?: React.CSSProperties["overflowX"]
  overflowY?: React.CSSProperties["overflowY"]
  "--st-block-width": React.CSSProperties["width"]
  maxWidth?: React.CSSProperties["maxWidth"]
  marginLeft?: React.CSSProperties["marginLeft"]
}

type CommandWidth = "stretch" | "hug" | number | undefined

/**
 * Reads the width from the FlexContext, and returns the contextually-aware
 * styles value.
 */
export const useLayoutStyles = <T>({
  width: containerWidth,
  element,
}: UseLayoutStylesArgs<T>): UseLayoutStylesShape => {
  const flexContext = useContext(FlexContext)

  /**
   * The width set from the `st.<command>`
   */
  const elementWidth = element?.width
  const useContainerWidth = element?.useContainerWidth

  // TODO: Consider rounding the width to the nearest pixel so we don't have
  // subpixel widths, which leads to blurriness on screen

  // TODO: Consider not doing this via javascript, but rather via CSS Custom
  // Properties instead. For now, this is fine as we are figuring out what needs
  // to be done. CSS Custom Properties will also be better for performance.

  const layoutStyles = useMemo((): UseLayoutStylesShape => {
    // If we don't have an element, we are rendering a root-level node, likely a
    // `StyledAppViewBlockContainer`
    if (!element) {
      return {
        width: containerWidth,
        "--st-block-width": containerWidth ? `${containerWidth}px` : undefined,
      }
    }

    if (!flexContext?.direction) {
      // If there is not a flexContext.direction, that means we are either not in
      // a container, or in a child of a container that does not have a
      // `direction` set.
      let commandWidth =
        useContainerWidth && isNonZeroPositiveNumber(containerWidth)
          ? containerWidth
          : elementWidth

      if (commandWidth && commandWidth < 0) {
        commandWidth = undefined
      }

      if (commandWidth !== undefined && isNaN(commandWidth)) {
        commandWidth = undefined
      }

      if (
        commandWidth !== undefined &&
        containerWidth !== undefined &&
        typeof containerWidth === "number" &&
        commandWidth > containerWidth
      ) {
        commandWidth = containerWidth
      }

      const widthWithFallback = commandWidth ?? "auto"

      const styles: UseLayoutStylesShape = {
        width: widthWithFallback,
        "--st-block-width":
          typeof commandWidth === "number"
            ? `${commandWidth}px`
            : widthWithFallback,
        maxWidth: "100%",
      }

      if (element.flex) {
        styles.flex = element.flex
      }

      return styles
    }

    // If there is a flexContext.direction, that means we are in a child of a
    // flex container that has set `direction={horizontal,vertical}`.
    // Therefore, we want to let the component figure out its own width, and
    // we should not pass it in.

    const style: UseLayoutStylesShape = {
      width: undefined,
      "--st-block-width": undefined,
    }

    const { direction } = flexContext

    const commandWidth: CommandWidth =
      useContainerWidth && !isNonZeroPositiveNumber(elementWidth)
        ? "stretch"
        : elementWidth

    switch (direction) {
      case "row": {
        // if (commandWidth === "stretch") {
        //   /**
        //    * To show off some options of possible behavior
        //    * - When `true` -> we take up the entire flex container width
        //    * - When `false` -> we utilize `flex: 1` to take up the remaining space
        //    *
        //    * Flip this boolean to see differences on elements that have `use_container_width=True`
        //    */
        //   // eslint-disable-next-line @typescript-eslint/naming-convention
        //   const TEMPORARY_useContainerWidth = false

        //   if (TEMPORARY_useContainerWidth) {
        //     style.flex = "1 0 100%"
        //   } else {
        //     style.flex = "1"
        //   }
        // } else if (
        //   // @ts-expect-error We haven't yet added `hug` to the system
        //   commandWidth === "hug"
        // ) {
        //   style.flex = "0 1 auto"
        // } else if (typeof commandWidth === "number") {
        //   style.flex = "0 1 auto"
        //   style.overflowX = "auto"

        //   if (isNonZeroPositiveNumber(commandWidth)) {
        //     style.width = commandWidth
        //     style.flex = `0 1 ${commandWidth}px`
        //   }
        // } else {
        const { align } = flexContext

        switch (align) {
          case BlockProto.Horizontal.Align.ALIGN_CENTER:
          case BlockProto.Horizontal.Align.ALIGN_START:
          case BlockProto.Horizontal.Align.ALIGN_END:
          case BlockProto.Horizontal.Align.BASELINE:
          case null:
            style.flex = "0 1 auto"
            break
          case BlockProto.Horizontal.Align.STRETCH:
            style.flex = "1"
            break
          case BlockProto.Vertical.Align.ALIGN_CENTER:
          case BlockProto.Vertical.Align.ALIGN_END:
          case BlockProto.Vertical.Align.ALIGN_START:
          case BlockProto.Vertical.Align.BASELINE:
          case BlockProto.Vertical.Align.STRETCH:
            // We aren't expecting these since it is "row" direction.
            break
          default:
            assertNever(align)
          //}
        }
        break
      }
      case "column": {
        // TODO:
        break
      }
      default: {
        assertNever(direction)
      }
    }

    const styles: UseLayoutStylesShape = {
      ...style,
      "--st-block-width": style.width,
    }

    if (element.justifyRight) {
      styles.marginLeft = "auto"
    }

    if (element.flex) {
      styles.flex = element.flex
    }

    return styles
  }, [flexContext, useContainerWidth, elementWidth, containerWidth, element])

  return layoutStyles
}
