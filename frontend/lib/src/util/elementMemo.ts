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
  ComponentProps,
  ComponentType,
  memo,
  MemoExoticComponent,
} from "react"

import isEqual from "lodash/isEqual"

export type ComponentPropsWithElementHash = {
  elementHash?: string
  element: any
  [key: string]: any
}

export function compareComponentProps<
  T extends ComponentType<ComponentPropsWithElementHash>
>(
  prevProps: Readonly<ComponentProps<T>>,
  nextProps: Readonly<ComponentProps<T>>
): boolean {
  const {
    elementHash: prevElementHash,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    element: ignorePrevElement,
    ...prevOthers
  } = prevProps
  const {
    elementHash: nextElementHash,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    element: ignoreNextElement,
    ...nextOthers
  } = nextProps

  return prevElementHash === nextElementHash && isEqual(prevOthers, nextOthers)
}

/**
 * Custom memo to compare only the elementHash and ignore the element prop to avoid unnecessary re-renders
 *
 * @param component
 * @returns
 */
export default function elementMemo<
  T extends ComponentType<P>,
  P extends ComponentPropsWithElementHash
>(component: T): MemoExoticComponent<T> {
  return memo(component, compareComponentProps)
}
