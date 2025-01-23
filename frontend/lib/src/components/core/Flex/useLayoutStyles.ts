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

import { useContext } from "react"

import { FlexContext } from "~lib/components/core/Flex/FlexContext"

export type Width = number | undefined

export type UseLayoutStylesArgs = {
  width: number | undefined
}

export type UseLayoutStylesShape = {
  width: Width
}

/**
 * Reads the width from the FlexContext, and if it exists, returns the
 * contextually-aware styles value. Right now, this only handles width, but may
 * include other things in the future.
 */
export const useLayoutStyles = ({
  width: argWidth,
}: UseLayoutStylesArgs): UseLayoutStylesShape => {
  const flexContext = useContext(FlexContext)
  // TODO: Consider rounding the width to the nearest pixel so we don't have
  // subpixel widths, which leads to blurriness on screen
  const width = !!flexContext?.direction
    ? // If there is a flexContext.direction, that means we are in a child of a
      // container that has set `direction={horizontal,vertical}`.
      // Therefore, we want to let the component figure out its own width, and
      // we should not pass it in.
      undefined
    : // If there is not a flexContext.direction, that means we are either not in
      // a container, or in a child of a container that does not have a
      // `direction` set.
      // Therefore, we should pass in the width that was passed to us.
      argWidth

  // TODO: Consider not doing this via javascript, but rather via CSS Custom
  // Properties instead. For now, this is fine as we are figuring out what needs
  // to be done. CSS Custom Properties will also be better for performance.
  return { width }
}
