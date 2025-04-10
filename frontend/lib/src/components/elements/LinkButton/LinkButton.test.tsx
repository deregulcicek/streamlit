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

import { screen } from "@testing-library/react"

import { LinkButton as LinkButtonProto } from "@streamlit/protobuf"

import { render } from "~lib/test_util"

import LinkButton, { Props } from "./LinkButton"

const getProps = (
  elementProps: Partial<LinkButtonProto> = {},
  widgetProps: Partial<Props> = {}
): Props => ({
  element: LinkButtonProto.create({
    label: "Label",
    url: "https://streamlit.io",
    ...elementProps,
  }),
  disabled: false,
  ...widgetProps,
})

describe("LinkButton widget", () => {
  it("renders without crashing", () => {
    const props = getProps()
    render(<LinkButton {...props} />)

    const linkButton = screen.getByRole("link")
    expect(linkButton).toBeInTheDocument()
  })

  it("has correct className", () => {
    const props = getProps()
    render(<LinkButton {...props} />)

    const linkButton = screen.getByTestId("stLinkButton")

    expect(linkButton).toHaveClass("stLinkButton")
  })

  it("renders a label within the button", () => {
    const props = getProps()
    render(<LinkButton {...props} />)

    const linkButton = screen.getByRole("link", {
      name: `${props.element.label}`,
    })

    expect(linkButton).toBeInTheDocument()
  })

  describe("wrapped BaseLinkButton", () => {
    const LINK_BUTTON_TYPES = ["primary", "secondary", "tertiary"]

    LINK_BUTTON_TYPES.forEach(type => {
      it(`renders ${type} link button correctly`, () => {
        render(<LinkButton {...getProps({ type })} />)

        const linkButton = screen.getByTestId(`stBaseLinkButton-${type}`)
        expect(linkButton).toBeInTheDocument()
      })

      it(`renders disabled ${type} correctly`, () => {
        render(<LinkButton {...getProps({ type }, { disabled: true })} />)

        const linkButton = screen.getByRole("link")
        expect(linkButton).toHaveAttribute("disabled")
      })
    })
  })
})
