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

import React, { ReactElement } from "react"

import axios from "axios"
import { screen, waitFor } from "@testing-library/react"

import { DeckGlJsonChart as DeckGlJsonChartProto } from "@streamlit/protobuf"

import { customRenderLibContext, render } from "~lib/test_util"

import withMapboxToken, {
  MapboxTokenFetchingError,
  TOKENS_URL,
  WrappedMapboxProps,
} from "./withMapboxToken"

interface TestProps {
  label: string
  width: number
  mapboxToken: string
}

describe("withMapboxToken", () => {
  const mockMapboxToken = "mockToken"
  const element = DeckGlJsonChartProto.create({
    // mock .streamlit/config.toml token
    mapboxToken: mockMapboxToken,
  })

  const emptyElement = DeckGlJsonChartProto.create({})

  function getProps(): WrappedMapboxProps<TestProps> {
    return {
      label: "mockLabel",
      width: 123,
      element,
    }
  }

  vi.mock("axios")

  // This component is only used to test whether or not the mapbox is correctly set
  const MockComponent = (props: {
    mapboxToken: string | undefined
  }): ReactElement => (
    <div data-testid="mock-component">{props.mapboxToken}</div>
  )

  describe("withMapboxToken rendering", () => {
    const DeltaType = "testDeltaType"
    const WrappedComponent = withMapboxToken(DeltaType)(MockComponent)
    const LIB_CONFIG_TOKEN = "LIB_TOKEN_CONFIG"

    beforeEach(() => {
      vi.resetAllMocks()
    })

    it("renders without crashing", () => {
      const props = getProps()
      render(<WrappedComponent {...props} />, {})
      const mockComponentText = screen.getByText(mockMapboxToken)
      expect(mockComponentText).toBeInTheDocument()
    })

    it("defines `displayName`", () => {
      expect(WrappedComponent.displayName).toEqual(
        "withMapboxToken(MockComponent)"
      )
    })

    it("should inject mapbox token to the wrapped component when available in the config.toml", () => {
      axios.get = vi.fn().mockImplementation(() => ({
        data: { userMapboxToken: mockMapboxToken },
      }))

      render(<WrappedComponent element={element} />)

      const mockComponentText = screen.getByText(mockMapboxToken)
      expect(mockComponentText).toBeInTheDocument()
    })

    it("should render loading alert while fetching the token", () => {
      axios.get = vi.fn().mockReturnValue(new Promise(() => {}))
      render(<WrappedComponent element={emptyElement} />)

      expect(screen.getByTestId("stSkeleton")).toBeInTheDocument()
    })

    it("should fetch the token if userMapboxToken is not present in config.toml and libConfig", async () => {
      axios.get = vi
        .fn()
        .mockResolvedValue({ data: { mapbox: mockMapboxToken } })

      render(<WrappedComponent element={emptyElement} />)

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(TOKENS_URL)
      })
    })

    it("should throw an error if fetched token is not present", async () => {
      let wrappedComponentInstance: any
      axios.get = vi
        .fn()
        .mockReturnValueOnce({ data: { mapbox: mockMapboxToken } })

      render(
        <WrappedComponent
          ref={ref => {
            wrappedComponentInstance = ref
          }}
          element={emptyElement}
        />
      )

      axios.get = vi.fn().mockRejectedValueOnce("ERROR")
      await expect(wrappedComponentInstance.initMapboxToken()).rejects.toThrow(
        new MapboxTokenFetchingError(`ERROR (${TOKENS_URL})`)
      )
    })

    it("should inject mapbox token to the wrapped component when available in the libConfig", async () => {
      axios.get = vi.fn().mockImplementation(() => ({
        data: { userMapboxToken: mockMapboxToken },
      }))

      customRenderLibContext(<WrappedComponent element={element} />, {
        libConfig: { mapboxToken: LIB_CONFIG_TOKEN },
      })

      await waitFor(() => {
        const element = screen.getByTestId("mock-component")
        expect(element.textContent).toBe(mockMapboxToken)
      })
    })

    it("prioritizes the libConfig token if no config.toml token and don't fetch our token", async () => {
      axios.get = vi
        .fn()
        .mockResolvedValue({ data: { mapbox: mockMapboxToken } })

      customRenderLibContext(<WrappedComponent element={emptyElement} />, {
        libConfig: { mapboxToken: LIB_CONFIG_TOKEN },
      })

      await waitFor(() => {
        const element = screen.getByTestId("mock-component")
        expect(element.textContent).toBe(LIB_CONFIG_TOKEN)
      })
    })
  })
})
