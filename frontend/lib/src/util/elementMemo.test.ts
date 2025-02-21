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

import { compareComponentProps } from "./elementMemo"

describe("elementMemo", () => {
  it("should compare element and elementHash props", () => {
    const node = {
      elementHash: "hash123",
      element: { type: "button" },
    }
    const prevProps = {
      node,
      scriptRunId: "run1",
      scriptRunState: "running",
      otherProp: "someValue",
    }
    const nextProps = {
      node,
      scriptRunId: "run2",
      scriptRunState: "running2",
      otherProp: "someValue",
    }

    expect(compareComponentProps(prevProps, nextProps)).toBe(true)
  })

  it("should return false when other props differ (different values)", () => {
    const prevProps = {
      node: {
        elementHash: "hash123",
        element: { type: "button" },
      },
      scriptRunId: "run1",
      scriptRunState: "running",
      otherProp: "someValue",
    }
    const nextProps = {
      node: {
        elementHash: "hash123",
        element: { type: "button" },
      },
      scriptRunId: "run2",
      scriptRunState: "running2",
      otherProp: "otherValue",
    }
    expect(compareComponentProps(prevProps, nextProps)).toBe(false)
  })

  it("should return false when other props differ (different props lengths)", () => {
    const prevProps = {
      node: {
        elementHash: "hash123",
        element: { type: "button" },
      },
      scriptRunId: "run1",
      scriptRunState: "running",
    }
    const nextProps = {
      node: {
        elementHash: "hash123",
        element: { type: "button" },
      },
      scriptRunId: "run2",
      scriptRunState: "running2",
      extraProp: "someValue",
    }
    expect(compareComponentProps(prevProps, nextProps)).toBe(false)
  })

  it("should return false when elementHash differs", () => {
    const prevProps = {
      node: {
        elementHash: "hash123",
        element: { type: "button" },
      },
      scriptRunId: "run1",
      scriptRunState: "running",
      otherProp: "someValue",
    }
    const nextProps = {
      node: {
        elementHash: "hash456",
        element: { type: "button" },
      },
      scriptRunId: "run2",
      scriptRunState: "running2",
      otherProp: "someValue",
    }

    expect(compareComponentProps(prevProps, nextProps)).toBe(false)
  })

  it("should return true for toast when deltaMsgReceivedAt is the same", () => {
    const prevProps = {
      node: {
        elementHash: "hash123",
        element: { type: "toast" },
        deltaMsgReceivedAt: 1000,
      },
      scriptRunId: "run1",
      scriptRunState: "running",
      otherProp: "someValue",
    }
    const nextProps = {
      node: {
        elementHash: "hash123",
        element: { type: "toast" },
        deltaMsgReceivedAt: 1000,
      },
      scriptRunId: "run1",
      scriptRunState: "running",
      otherProp: "someValue",
    }
    expect(compareComponentProps(prevProps, nextProps)).toBe(true)
  })

  it("should return false for toast when deltaMsgReceivedAt differs", () => {
    const prevProps = {
      node: {
        elementHash: "hash123",
        element: { type: "toast" },
        deltaMsgReceivedAt: 1000,
      },
      scriptRunId: "run1",
      scriptRunState: "running",
      otherProp: "someValue",
    }
    const nextProps = {
      node: {
        elementHash: "hash123",
        element: { type: "toast" },
        deltaMsgReceivedAt: 2000,
      },
      scriptRunId: "run1",
      scriptRunState: "running",
      otherProp: "someValue",
    }

    expect(compareComponentProps(prevProps, nextProps)).toBe(false)
  })
})
