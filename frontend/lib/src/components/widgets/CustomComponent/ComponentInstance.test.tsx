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

import React from "react"

import { Mock, MockInstance } from "vitest"
import { act, fireEvent, screen } from "@testing-library/react"

import {
  ComponentInstance as ComponentInstanceProto,
  SpecialArg,
} from "@streamlit/protobuf"

import {
  DEFAULT_IFRAME_FEATURE_POLICY,
  DEFAULT_IFRAME_SANDBOX_POLICY,
} from "~lib/util/IFrameUtil"
import { WidgetStateManager } from "~lib/WidgetStateManager"
import { bgColorToBaseString, toExportedTheme } from "~lib/theme"
import { mockEndpoints } from "~lib/mocks/mocks"
import { mockTheme } from "~lib/mocks/mockTheme"
import { render } from "~lib/test_util"
import * as UseResizeObserver from "~lib/hooks/useResizeObserver"

import ComponentInstance, {
  COMPONENT_READY_WARNING_TIME_MS,
} from "./ComponentInstance"
import {
  LOG as componentUtilsLog,
  CUSTOM_COMPONENT_API_VERSION,
} from "./componentUtils"
import { ComponentRegistry } from "./ComponentRegistry"
import { ComponentMessageType, StreamlitMessageType } from "./enums"

// We have some timeouts that we want to use fake timers for.
vi.useFakeTimers()

// Mock uri utils.
vi.mock("@streamlit/utils", async () => {
  const actualModule = await vi.importActual("@streamlit/utils")
  const mockedBuildHttpUri = vi.fn().mockImplementation(() => "registry/url")

  return {
    ...actualModule,
    buildHttpUri: mockedBuildHttpUri,
  }
})

// Mock our WidgetStateManager
vi.mock("~lib/WidgetStateManager")

const MOCK_COMPONENT_URL = "http://a.mock.url"
const MOCK_WIDGET_ID = "mock_widget_id"
const MOCK_COMPONENT_NAME = "mock_component_name"

describe("ComponentInstance", () => {
  let logWarnSpy: MockInstance
  const getComponentRegistry = (): ComponentRegistry => {
    return new ComponentRegistry(mockEndpoints())
  }

  beforeEach(() => {
    // Clear our class mocks
    const mockWidgetStateManager = WidgetStateManager as unknown as Mock
    mockWidgetStateManager.mockClear()

    logWarnSpy = vi
      .spyOn(componentUtilsLog, "warn")
      .mockImplementation(() => {})

    vi.spyOn(UseResizeObserver, "useResizeObserver").mockReturnValue({
      elementRef: React.createRef(),
      forceRecalculate: vitest.fn(),
      values: [250],
    })
  })

  it("registers a message listener on render", () => {
    const componentRegistry = getComponentRegistry()
    const registerListener = vi.spyOn(componentRegistry, "registerListener")
    render(
      <ComponentInstance
        element={createElementProp()}
        registry={componentRegistry}
        disabled={false}
        widgetMgr={
          new WidgetStateManager({
            sendRerunBackMsg: vi.fn(),
            formsDataChanged: vi.fn(),
          })
        }
      />
    )
    expect(registerListener).toHaveBeenCalledTimes(1)
  })

  it("deregisters its message listener on rerender", () => {
    const componentRegistry = getComponentRegistry()
    const deregisterListener = vi.spyOn(
      componentRegistry,
      "deregisterListener"
    )
    const { unmount } = render(
      <ComponentInstance
        element={createElementProp()}
        registry={componentRegistry}
        disabled={false}
        widgetMgr={
          new WidgetStateManager({
            sendRerunBackMsg: vi.fn(),
            formsDataChanged: vi.fn(),
          })
        }
      />
    )
    unmount()
    expect(deregisterListener).toHaveBeenCalledTimes(1)
  })

  it("renders its iframe correctly", () => {
    const componentRegistry = getComponentRegistry()
    render(
      <ComponentInstance
        element={createElementProp()}
        registry={componentRegistry}
        disabled={false}
        widgetMgr={
          new WidgetStateManager({
            sendRerunBackMsg: vi.fn(),
            formsDataChanged: vi.fn(),
          })
        }
      />
    )
    const iframe = screen.getByTitle(MOCK_COMPONENT_NAME)
    expect(iframe).toHaveAttribute(
      "src",
      "http://a.mock.url?streamlitUrl=http%3A%2F%2Flocalhost%3A3000%2F"
    )
    expect(iframe).toHaveAttribute("allow", DEFAULT_IFRAME_FEATURE_POLICY)
    expect(iframe).toHaveAttribute("sandbox", DEFAULT_IFRAME_SANDBOX_POLICY)
    expect(iframe).toHaveClass("stCustomComponentV1")
  })

  it("displays a skeleton initially with a certain height", () => {
    const componentRegistry = getComponentRegistry()
    render(
      <ComponentInstance
        element={createElementProp()}
        registry={componentRegistry}
        disabled={false}
        widgetMgr={
          new WidgetStateManager({
            sendRerunBackMsg: vi.fn(),
            formsDataChanged: vi.fn(),
          })
        }
      />
    )
    const skeleton = screen.getByTestId("stSkeleton")
    expect(skeleton).toBeInTheDocument()
    expect(skeleton).toHaveStyle("height: 2.75rem")

    const iframe = screen.getByTitle(MOCK_COMPONENT_NAME)
    expect(iframe).toHaveAttribute("height", "0")
  })

  it("will not displays a skeleton when height is explicitly set to 0", () => {
    const componentRegistry = getComponentRegistry()
    render(
      <ComponentInstance
        element={createElementProp({ height: 0 })}
        registry={componentRegistry}
        disabled={false}
        widgetMgr={
          new WidgetStateManager({
            sendRerunBackMsg: vi.fn(),
            formsDataChanged: vi.fn(),
          })
        }
      />
    )
    expect(screen.queryByTestId("stSkeleton")).not.toBeInTheDocument()

    const iframe = screen.getByTitle(MOCK_COMPONENT_NAME)
    expect(iframe).toHaveAttribute("height", "0")
  })

  describe("COMPONENT_READY handler", () => {
    it("posts a RENDER message to the iframe", () => {
      const jsonArgs = { foo: "string", bar: 5 }
      const componentRegistry = getComponentRegistry()
      render(
        <ComponentInstance
          element={createElementProp(jsonArgs)}
          registry={componentRegistry}
          disabled={false}
          widgetMgr={
            new WidgetStateManager({
              sendRerunBackMsg: vi.fn(),
              formsDataChanged: vi.fn(),
            })
          }
        />
      )
      const iframe = screen.getByTitle(MOCK_COMPONENT_NAME)
      // @ts-expect-error
      const postMessage = vi.spyOn(iframe.contentWindow, "postMessage")
      // SET COMPONENT_READY
      fireEvent(
        window,
        new MessageEvent("message", {
          data: {
            isStreamlitMessage: true,
            apiVersion: 1,
            type: ComponentMessageType.COMPONENT_READY,
          },
          // @ts-expect-error
          source: iframe.contentWindow,
        })
      )
      expect(postMessage).toHaveBeenCalledWith(renderMsg(jsonArgs, []), "*")
    })

    it("hides the skeleton and maintains iframe height of 0", () => {
      const componentRegistry = getComponentRegistry()
      render(
        <ComponentInstance
          element={createElementProp()}
          registry={componentRegistry}
          disabled={false}
          widgetMgr={
            new WidgetStateManager({
              sendRerunBackMsg: vi.fn(),
              formsDataChanged: vi.fn(),
            })
          }
        />
      )

      const iframe = screen.getByTitle(MOCK_COMPONENT_NAME)

      // SET COMPONENT_READY
      fireEvent(
        window,
        new MessageEvent("message", {
          data: {
            isStreamlitMessage: true,
            apiVersion: 1,
            type: ComponentMessageType.COMPONENT_READY,
          },
          // @ts-expect-error
          source: iframe.contentWindow,
        })
      )
      expect(screen.queryByTestId("stSkeleton")).not.toBeInTheDocument()
      expect(iframe).toHaveAttribute("height", "0")
    })

    it("prevents RENDER message until component is ready", () => {
      const jsonArgs = { foo: "string", bar: 5 }
      const componentRegistry = getComponentRegistry()
      render(
        <ComponentInstance
          element={createElementProp(jsonArgs)}
          registry={componentRegistry}
          disabled={false}
          widgetMgr={
            new WidgetStateManager({
              sendRerunBackMsg: vi.fn(),
              formsDataChanged: vi.fn(),
            })
          }
        />
      )
      const iframe = screen.getByTitle(MOCK_COMPONENT_NAME)
      // @ts-expect-error
      const postMessage = vi.spyOn(iframe.contentWindow, "postMessage")
      expect(postMessage).toHaveBeenCalledTimes(0)
    })

    it("can be called multiple times", () => {
      // It's not an error for a component to call READY multiple times.
      // (This can happen during development, when the component's devserver
      // reloads.)
      const jsonArgs = { foo: "string", bar: 5 }
      const componentRegistry = getComponentRegistry()
      render(
        <ComponentInstance
          element={createElementProp(jsonArgs)}
          registry={componentRegistry}
          disabled={false}
          widgetMgr={
            new WidgetStateManager({
              sendRerunBackMsg: vi.fn(),
              formsDataChanged: vi.fn(),
            })
          }
        />
      )
      const iframe = screen.getByTitle(MOCK_COMPONENT_NAME)
      // @ts-expect-error
      const postMessage = vi.spyOn(iframe.contentWindow, "postMessage")
      // SET COMPONENT_READY
      fireEvent(
        window,
        new MessageEvent("message", {
          data: {
            isStreamlitMessage: true,
            apiVersion: 1,
            type: ComponentMessageType.COMPONENT_READY,
          },
          // @ts-expect-error
          source: iframe.contentWindow,
        })
      )
      // SET COMPONENT_READY
      fireEvent(
        window,
        new MessageEvent("message", {
          data: {
            isStreamlitMessage: true,
            apiVersion: 1,
            type: ComponentMessageType.COMPONENT_READY,
          },
          // @ts-expect-error
          source: iframe.contentWindow,
        })
      )
      expect(postMessage).toHaveBeenCalledTimes(2)
    })

    it("send render message whenever the args change and the component is ready", () => {
      let jsonArgs = { foo: "string", bar: 5 }
      const componentRegistry = getComponentRegistry()
      const { rerender } = render(
        <ComponentInstance
          element={createElementProp(jsonArgs)}
          registry={componentRegistry}
          disabled={false}
          widgetMgr={
            new WidgetStateManager({
              sendRerunBackMsg: vi.fn(),
              formsDataChanged: vi.fn(),
            })
          }
        />
      )
      const iframe = screen.getByTitle(MOCK_COMPONENT_NAME)
      // @ts-expect-error
      const postMessage = vi.spyOn(iframe.contentWindow, "postMessage")
      // SET COMPONENT_READY
      fireEvent(
        window,
        new MessageEvent("message", {
          data: {
            isStreamlitMessage: true,
            apiVersion: 1,
            type: ComponentMessageType.COMPONENT_READY,
          },
          // @ts-expect-error
          source: iframe.contentWindow,
        })
      )
      jsonArgs = { foo: "string", bar: 10 }
      rerender(
        <ComponentInstance
          element={createElementProp(jsonArgs)}
          registry={componentRegistry}
          disabled={false}
          widgetMgr={
            new WidgetStateManager({
              sendRerunBackMsg: vi.fn(),
              formsDataChanged: vi.fn(),
            })
          }
        />
      )

      expect(postMessage).toHaveBeenCalledTimes(2)
    })

    it("send render message when viewport changes", () => {
      let width = 100
      vi.spyOn(UseResizeObserver, "useResizeObserver").mockReturnValue({
        elementRef: React.createRef(),
        forceRecalculate: vitest.fn(),
        values: [width],
      })

      const jsonArgs = { foo: "string", bar: 5 }
      const componentRegistry = getComponentRegistry()
      const { rerender } = render(
        <ComponentInstance
          element={createElementProp(jsonArgs)}
          registry={componentRegistry}
          disabled={false}
          widgetMgr={
            new WidgetStateManager({
              sendRerunBackMsg: vi.fn(),
              formsDataChanged: vi.fn(),
            })
          }
        />
      )
      const iframe = screen.getByTitle(MOCK_COMPONENT_NAME)
      // @ts-expect-error
      const postMessage = vi.spyOn(iframe.contentWindow, "postMessage")
      // SET COMPONENT_READY
      fireEvent(
        window,
        new MessageEvent("message", {
          data: {
            isStreamlitMessage: true,
            apiVersion: 1,
            type: ComponentMessageType.COMPONENT_READY,
          },
          // @ts-expect-error
          source: iframe.contentWindow,
        })
      )
      width = width + 1

      // Update the spy to return the new width
      vi.spyOn(UseResizeObserver, "useResizeObserver").mockReturnValue({
        elementRef: React.createRef(),
        forceRecalculate: vitest.fn(),
        values: [width],
      })

      rerender(
        <ComponentInstance
          element={createElementProp(jsonArgs)}
          registry={componentRegistry}
          disabled={false}
          widgetMgr={
            new WidgetStateManager({
              sendRerunBackMsg: vi.fn(),
              formsDataChanged: vi.fn(),
            })
          }
        />
      )

      expect(postMessage).toHaveBeenCalledTimes(2)
    })

    it("errors on unrecognized API version", () => {
      const badAPIVersion = CUSTOM_COMPONENT_API_VERSION + 1
      const jsonArgs = { foo: "string", bar: 5 }
      const componentRegistry = getComponentRegistry()
      render(
        <ComponentInstance
          element={createElementProp(jsonArgs)}
          registry={componentRegistry}
          disabled={false}
          widgetMgr={
            new WidgetStateManager({
              sendRerunBackMsg: vi.fn(),
              formsDataChanged: vi.fn(),
            })
          }
        />
      )
      const iframe = screen.getByTitle(MOCK_COMPONENT_NAME)
      // SET COMPONENT_READY
      fireEvent(
        window,
        new MessageEvent("message", {
          data: {
            isStreamlitMessage: true,
            apiVersion: badAPIVersion,
            type: ComponentMessageType.COMPONENT_READY,
          },
          // @ts-expect-error
          source: iframe.contentWindow,
        })
      )
      expect(screen.getByTestId("stAlertContentError")).toBeVisible()
    })

    it("errors on unrecognized special args", () => {
      const jsonArgs = {}
      const element = createElementProp(jsonArgs, [
        new SpecialArg({ key: "foo" }),
      ])
      const componentRegistry = getComponentRegistry()
      render(
        <ComponentInstance
          element={element}
          registry={componentRegistry}
          disabled={false}
          widgetMgr={
            new WidgetStateManager({
              sendRerunBackMsg: vi.fn(),
              formsDataChanged: vi.fn(),
            })
          }
        />
      )
      expect(
        screen.getByText("Unrecognized SpecialArg type: undefined")
      ).toBeVisible()
    })

    it("warns if COMPONENT_READY hasn't been received after a timeout", () => {
      const componentRegistry = getComponentRegistry()
      render(
        <ComponentInstance
          element={createElementProp()}
          registry={componentRegistry}
          disabled={false}
          widgetMgr={
            new WidgetStateManager({
              sendRerunBackMsg: vi.fn(),
              formsDataChanged: vi.fn(),
            })
          }
        />
      )
      // Advance past our warning timeout, and force a re-render.
      act(() => vi.advanceTimersByTime(COMPONENT_READY_WARNING_TIME_MS))

      expect(
        screen.getByText(/The app is attempting to load the component from/)
      ).toBeVisible()
    })
  })

  describe("SET_COMPONENT_VALUE handler", () => {
    it("handles JSON values", () => {
      const jsonValue = {
        foo: "string",
        bar: 123,
        list: [1, "foo", false],
      }

      const componentRegistry = getComponentRegistry()
      const element = createElementProp(jsonValue)
      render(
        <ComponentInstance
          element={element}
          registry={componentRegistry}
          disabled={false}
          widgetMgr={
            new WidgetStateManager({
              sendRerunBackMsg: vi.fn(),
              formsDataChanged: vi.fn(),
            })
          }
        />
      )

      const iframe = screen.getByTitle(MOCK_COMPONENT_NAME)
      // SET COMPONENT_READY
      fireEvent(
        window,
        new MessageEvent("message", {
          data: {
            isStreamlitMessage: true,
            apiVersion: 1,
            type: ComponentMessageType.COMPONENT_READY,
          },
          // @ts-expect-error
          source: iframe.contentWindow,
        })
      )
      // SET COMPONENT_VALUE
      fireEvent(
        window,
        new MessageEvent("message", {
          data: {
            isStreamlitMessage: true,
            apiVersion: 1,
            type: ComponentMessageType.SET_COMPONENT_VALUE,
            dataType: "json",
            value: jsonValue,
          },
          // @ts-expect-error
          source: iframe.contentWindow,
        })
      )
      const widgetMgr = (WidgetStateManager as any).mock.instances[0]
      expect(widgetMgr.setJsonValue).toHaveBeenCalledWith(
        element,
        jsonValue,
        {
          fromUi: true,
        },
        undefined
      )
    })

    it("handles bytes values", () => {
      const jsonValue = {}

      const componentRegistry = getComponentRegistry()
      const element = createElementProp(jsonValue)
      render(
        <ComponentInstance
          element={element}
          registry={componentRegistry}
          disabled={false}
          widgetMgr={
            new WidgetStateManager({
              sendRerunBackMsg: vi.fn(),
              formsDataChanged: vi.fn(),
            })
          }
          // Also verify that we can pass a fragmentID down to setBytesValue.
          fragmentId="myFragmentId"
        />
      )

      const iframe = screen.getByTitle(MOCK_COMPONENT_NAME)
      // SET COMPONENT_READY
      fireEvent(
        window,
        new MessageEvent("message", {
          data: {
            isStreamlitMessage: true,
            apiVersion: 1,
            type: ComponentMessageType.COMPONENT_READY,
          },
          // @ts-expect-error
          source: iframe.contentWindow,
        })
      )

      const bytesValue = new Uint8Array([0, 1, 2])
      // SET COMPONENT_VALUE
      fireEvent(
        window,
        new MessageEvent("message", {
          data: {
            isStreamlitMessage: true,
            apiVersion: 1,
            type: ComponentMessageType.SET_COMPONENT_VALUE,
            dataType: "bytes",
            value: bytesValue,
          },
          // @ts-expect-error
          source: iframe.contentWindow,
        })
      )
      const widgetMgr = (WidgetStateManager as any).mock.instances[0]
      expect(widgetMgr.setBytesValue).toHaveBeenCalledWith(
        element,
        bytesValue,
        { fromUi: true },
        "myFragmentId"
      )
    })

    //   // TODO: implement test to check handling of daataframe values

    it("warns if called before COMPONENT_READY", () => {
      const jsonValue = {
        foo: "string",
        bar: 123,
        list: [1, "foo", false],
      }

      const componentRegistry = getComponentRegistry()
      const element = createElementProp(jsonValue)
      render(
        <ComponentInstance
          element={element}
          registry={componentRegistry}
          disabled={false}
          widgetMgr={
            new WidgetStateManager({
              sendRerunBackMsg: vi.fn(),
              formsDataChanged: vi.fn(),
            })
          }
        />
      )
      const iframe = screen.getByTitle(MOCK_COMPONENT_NAME)
      // SET COMPONENT_VALUE
      fireEvent(
        window,
        new MessageEvent("message", {
          data: {
            isStreamlitMessage: true,
            apiVersion: 1,
            type: ComponentMessageType.SET_COMPONENT_VALUE,
            dataType: "bytes",
            value: jsonValue,
          },
          // @ts-expect-error
          source: iframe.contentWindow,
        })
      )
      const widgetMgr = (WidgetStateManager as any).mock.instances[0]
      expect(widgetMgr.setJsonValue).not.toHaveBeenCalled()

      expect(logWarnSpy).toHaveBeenCalledWith(
        `Got ${ComponentMessageType.SET_COMPONENT_VALUE} before ${ComponentMessageType.COMPONENT_READY}!`
      )
    })

    describe("SET_FRAME_HEIGHT handler", () => {
      it("updates the frameHeight without re-rendering", () => {
        const jsonValue = {}
        const componentRegistry = getComponentRegistry()
        const element = createElementProp(jsonValue)
        render(
          <ComponentInstance
            element={element}
            registry={componentRegistry}
            disabled={false}
            widgetMgr={
              new WidgetStateManager({
                sendRerunBackMsg: vi.fn(),
                formsDataChanged: vi.fn(),
              })
            }
          />
        )
        const iframe = screen.getByTitle(MOCK_COMPONENT_NAME)
        // SET COMPONENT_READY
        fireEvent(
          window,
          new MessageEvent("message", {
            data: {
              isStreamlitMessage: true,
              apiVersion: 1,
              type: ComponentMessageType.COMPONENT_READY,
            },
            // @ts-expect-error
            source: iframe.contentWindow,
          })
        )
        // SET IFRAME_HEIGHT
        fireEvent(
          window,
          new MessageEvent("message", {
            data: {
              isStreamlitMessage: true,
              apiVersion: 1,
              type: ComponentMessageType.SET_FRAME_HEIGHT,
              height: 100,
            },
            // @ts-expect-error
            source: iframe.contentWindow,
          })
        )

        // Updating the frameheight intentionally does *not* cause a re-render
        // (instead, it directly updates the iframeRef) - so we can't check
        // that `child.prop("height") == 100`
        expect(iframe).toHaveAttribute("height", "100")
      })

      it("warns if called before COMPONENT_READY", () => {
        const jsonValue = {
          foo: "string",
          bar: 123,
          list: [1, "foo", false],
        }

        const componentRegistry = getComponentRegistry()
        const element = createElementProp(jsonValue)
        render(
          <ComponentInstance
            element={element}
            registry={componentRegistry}
            disabled={false}
            widgetMgr={
              new WidgetStateManager({
                sendRerunBackMsg: vi.fn(),
                formsDataChanged: vi.fn(),
              })
            }
          />
        )
        const iframe = screen.getByTitle(MOCK_COMPONENT_NAME)
        // SET IFRAME_HEIGHT
        fireEvent(
          window,
          new MessageEvent("message", {
            data: {
              isStreamlitMessage: true,
              apiVersion: 1,
              type: ComponentMessageType.SET_FRAME_HEIGHT,
              height: 100,
            },
            // @ts-expect-error
            source: iframe.contentWindow,
          })
        )
        const widgetMgr = (WidgetStateManager as any).mock.instances[0]
        expect(widgetMgr.setJsonValue).not.toHaveBeenCalled()

        expect(logWarnSpy).toHaveBeenCalledWith(
          `Got ${ComponentMessageType.SET_FRAME_HEIGHT} before ${ComponentMessageType.COMPONENT_READY}!`
        )
      })
    })
  })

  function renderMsg(
    args: { [name: string]: any },
    dataframes: any[],
    disabled = false,
    theme = {
      ...toExportedTheme(mockTheme.emotion),
      base: bgColorToBaseString(mockTheme.emotion.colors.bgColor),
    }
  ): any {
    return forwardMsg(StreamlitMessageType.RENDER, {
      args,
      dfs: dataframes,
      disabled,
      theme,
    })
  }

  function forwardMsg(type: StreamlitMessageType, data: any): any {
    return { type, ...data }
  }

  /** Create a ComponentInstance.props.element prop with the given args. */
  function createElementProp(
    jsonArgs: { [name: string]: any } = {},
    specialArgs: SpecialArg[] = []
  ): ComponentInstanceProto {
    return ComponentInstanceProto.create({
      jsonArgs: JSON.stringify(jsonArgs),
      specialArgs,
      componentName: MOCK_COMPONENT_NAME,
      id: MOCK_WIDGET_ID,
      url: MOCK_COMPONENT_URL,
    })
  }
})
