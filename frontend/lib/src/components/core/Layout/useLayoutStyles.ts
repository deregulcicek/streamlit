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
import { FlexContext } from "../Flex/FlexContext"

export type UseLayoutStylesArgs<T> = {
  width: React.CSSProperties["width"] | undefined
  element:
    | (T & {
        width?: number
        height?: number
        useContainerWidth?: boolean | null
        flex?: string
        scale?: number
        floatLeft?: boolean
      })
    | undefined
}

const isNonZeroPositiveNumber = (value: unknown): value is number =>
  typeof value === "number" && value > 0 && !isNaN(value)

export type UseLayoutStylesShape = {
  width: React.CSSProperties["width"]
  maxWidth?: React.CSSProperties["maxWidth"]
  flex?: React.CSSProperties["flex"]
  height?: React.CSSProperties["height"]
  marginLeft?: React.CSSProperties["marginLeft"]
}

const validateWidth = (
  width:
    | React.CSSProperties["width"]
    | React.CSSProperties["height"]
    | undefined
): React.CSSProperties["width"] | React.CSSProperties["height"] => {
  if (typeof width === "number") {
    if (width === 0) {
      // An element with no width should be treated as if it has no width set
      // This is likely from the proto, where the default value is 0
      return "auto"
    }

    if (width && width < 0) {
      return "auto"
    }

    if (width !== undefined && isNaN(width)) {
      return "auto"
    }
  }

  return width
}

const checkAndFixOverflow = (
  width: React.CSSProperties["width"],
  containerWidth: React.CSSProperties["width"]
) => {
  if (width === undefined || containerWidth === undefined) {
    return width
  }
  if (
    Number.isInteger(Number(width)) &&
    Number.isInteger(Number(containerWidth))
  ) {
    if (width > containerWidth) {
      return containerWidth
    }
  }
  return width
}

/**
 * Returns the contextually-aware style values for an element container
 */
export const useLayoutStyles = <T>({
  width: containerWidth,
  element,
}: UseLayoutStylesArgs<T>): UseLayoutStylesShape => {
  /**
   * The width set from the `st.<command>`
   */
  const commandWidth = element?.width
  const commandHeight = element?.height
  const useContainerWidth = element?.useContainerWidth
  const flexContext = useContext(FlexContext)

  let direction
  if (flexContext) {
    direction = flexContext.direction
  }

  // Note: Consider rounding the width to the nearest pixel so we don't have
  // subpixel widths, which leads to blurriness on screen

  const layoutStyles = useMemo((): UseLayoutStylesShape => {
    // If we don't have an element, we are rendering a root-level node, likely a
    // `StyledAppViewBlockContainer`
    if (!element) {
      return {
        width: containerWidth,
      }
    }

    if (element.floatLeft) {
      return {
        marginLeft: "auto",
      }
    }

    if ("imgs" in element) {
      /**
       * ImageList overrides its `width` param and handles its own width in the
       * component. There should not be any element-specific carve-outs in this
       * file, but given the long-standing behavior of ImageList, we have to
       * make an exception here.
       *
       * @see WidthBehavior on the Backend
       * @see the Image.proto file
       */
      return {
        width: containerWidth,
      }
    }

    if (useContainerWidth) {
      let validatedContainerWidth = validateWidth(containerWidth)

      return {
        width: validatedContainerWidth,
        maxWidth: "100%",
        flex: `1 0 ${validatedContainerWidth}px`,
      }
    }

    if (Number.isInteger(Number(commandWidth))) {
      let validatedCommandWidth = validateWidth(commandWidth)
      // This causes some issues with width on containers and doesn't seem to make
      // Sense in a situation where there is more than one element in a row.
      // validatedCommandWidth = checkAndFixOverflow(
      //   validatedCommandWidth,
      //   containerWidth
      // )

      if (direction && direction === "row") {
        return {
          width: `${validatedCommandWidth}px`,
          maxWidth: "100%",
          flex: `0 0 ${validatedCommandWidth}px`,
        }
      } else {
        return {
          width: `${validatedCommandWidth}px`,
          maxWidth: "100%",
        }
      }
    }

    if (typeof commandWidth === "string" && commandWidth === "stretch") {
      if (element.scale) {
        return {
          width: "100%",
          maxWidth: "100%",
          flex: `${element.scale}`,
        }
      }

      return {
        width: "100%",
        maxWidth: "100%",
      }
    }

    return {
      width: "auto",
      maxWidth: "100%",
    }
  }, [useContainerWidth, commandWidth, containerWidth, element])

  return layoutStyles
}
