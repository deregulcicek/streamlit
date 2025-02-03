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

import {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"

export type DOMRectKeys =
  | "bottom"
  | "height"
  | "left"
  | "right"
  | "top"
  | "width"
  | "x"
  | "y"

export const useResizeObserver = <T extends HTMLDivElement>(
  properties: DOMRectKeys[]
): {
  values: number[]
  elementRef: MutableRefObject<T | null>
  forceRecalculate: () => void
} => {
  const elementRef = useRef<T | null>(null)
  const [values, setValues] = useState<number[]>([])

  const getValues = useCallback(() => {
    if (!elementRef.current) {
      return []
    }

    const rect = elementRef.current.getBoundingClientRect()

    return properties.map(property => {
      return rect[property]
    })
  }, [properties])

  const forceRecalculate = useCallback(() => {
    setValues(getValues())
  }, [getValues])

  useEffect(() => {
    if (!elementRef.current) {
      return
    }

    setValues(getValues())

    let frameId: number
    const observer = new ResizeObserver(() => {
      frameId = window.requestAnimationFrame(() => {
        setValues(getValues())
      })
    })

    observer.observe(elementRef.current)

    return () => {
      observer.disconnect()
      if (frameId) {
        cancelAnimationFrame(frameId)
      }
    }
  }, [properties, getValues])

  return { values, elementRef, forceRecalculate }
}
