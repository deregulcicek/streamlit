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
  ReactElement,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
} from "react"

import { useTheme } from "@emotion/react"
import classNames from "classnames"

import { Block as BlockProto } from "@streamlit/protobuf"

import { AppNode, BlockNode, ElementNode } from "~lib/AppNode"
import { FlexContextProvider } from "~lib/components/core/Flex/FlexContext"
import { useLayoutStyles } from "~lib/components/core/Flex/useLayoutStyles"
import { LibContext } from "~lib/components/core/LibContext"
import ChatMessage from "~lib/components/elements/ChatMessage"
import Dialog from "~lib/components/elements/Dialog"
import Expander from "~lib/components/elements/Expander"
import Popover from "~lib/components/elements/Popover"
import Tabs, { TabProps } from "~lib/components/elements/Tabs"
import { Form } from "~lib/components/widgets/Form"
import { useScrollToBottom } from "~lib/hooks/useScrollToBottom"
import { getElementId, notNullOrUndefined } from "~lib/util/utils"
import { useResizeObserver } from "~lib/hooks/useResizeObserver"

import ElementNodeRenderer from "./ElementNodeRenderer"
import {
  StyledColumn,
  StyledHorizontalBlock,
  StyledVerticalBlock,
  StyledVerticalBlockBorderWrapper,
  StyledVerticalBlockBorderWrapperProps,
  StyledVerticalBlockWrapper,
} from "./styled-components"
import {
  assignDividerColor,
  BaseBlockProps,
  convertKeyToClassName,
  getKeyFromId,
  isComponentStale,
  shouldComponentBeEnabled,
} from "./utils"

export interface BlockPropsWithoutWidth extends BaseBlockProps {
  node: BlockNode
}

interface BlockPropsWithWidth extends BaseBlockProps {
  node: BlockNode
  width: number
}

// Render BlockNodes (i.e. container nodes).
const BlockNodeRenderer = (props: BlockPropsWithWidth): ReactElement => {
  const { node } = props
  const { fragmentIdsThisRun } = useContext(LibContext)

  if (node.isEmpty && !node.deltaBlock.allowEmpty) {
    return <></>
  }

  const enable = shouldComponentBeEnabled("", props.scriptRunState)
  const isStale = isComponentStale(
    enable,
    node,
    props.scriptRunState,
    props.scriptRunId,
    fragmentIdsThisRun
  )

  const childProps = { ...props, ...{ node } }

  const disableFullscreenMode =
    props.disableFullscreenMode ||
    notNullOrUndefined(node.deltaBlock.dialog) ||
    notNullOrUndefined(node.deltaBlock.popover)

  const child: ReactElement = (
    <LayoutBlock
      {...childProps}
      disableFullscreenMode={disableFullscreenMode}
    />
  )

  if (node.deltaBlock.dialog) {
    return (
      <Dialog
        element={node.deltaBlock.dialog as BlockProto.Dialog}
        deltaMsgReceivedAt={node.deltaMsgReceivedAt}
      >
        {child}
      </Dialog>
    )
  }

  if (node.deltaBlock.expandable) {
    return (
      <Expander
        empty={node.isEmpty}
        isStale={isStale}
        element={node.deltaBlock.expandable as BlockProto.Expandable}
      >
        {child}
      </Expander>
    )
  }

  if (node.deltaBlock.popover) {
    return (
      <Popover
        empty={node.isEmpty}
        element={node.deltaBlock.popover as BlockProto.Popover}
        width={props.width}
      >
        {child}
      </Popover>
    )
  }

  if (node.deltaBlock.type === "form") {
    const { formId, clearOnSubmit, enterToSubmit, border } = node.deltaBlock
      .form as BlockProto.Form
    const submitButtons = props.formsData.submitButtons.get(formId)
    const hasSubmitButton =
      submitButtons !== undefined && submitButtons.length > 0
    return (
      <Form
        formId={formId}
        clearOnSubmit={clearOnSubmit}
        enterToSubmit={enterToSubmit}
        hasSubmitButton={hasSubmitButton}
        scriptRunState={props.scriptRunState}
        widgetMgr={props.widgetMgr}
        border={border}
      >
        {child}
      </Form>
    )
  }

  if (node.deltaBlock.chatMessage) {
    return (
      <ChatMessage
        element={node.deltaBlock.chatMessage as BlockProto.ChatMessage}
        endpoints={props.endpoints}
      >
        {child}
      </ChatMessage>
    )
  }

  if (node.deltaBlock.column) {
    return (
      <StyledColumn
        weight={node.deltaBlock.column.weight ?? 0}
        gap={node.deltaBlock.column.gap ?? ""}
        verticalAlignment={
          node.deltaBlock.column.verticalAlignment ?? undefined
        }
        showBorder={node.deltaBlock.column.showBorder ?? false}
        className="stColumn"
        data-testid="stColumn"
      >
        {child}
      </StyledColumn>
    )
  }

  if (node.deltaBlock.tabContainer) {
    const renderTabContent = (
      mappedChildProps: JSX.IntrinsicAttributes & BlockPropsWithoutWidth
    ): ReactElement => {
      // avoid circular dependency where Tab uses VerticalBlock but VerticalBlock uses tabs
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return <VerticalBlock {...mappedChildProps}></VerticalBlock>
    }
    const tabsProps: TabProps = { ...childProps, isStale, renderTabContent }
    return <Tabs {...tabsProps} />
  }

  if (notNullOrUndefined(node.deltaBlock.horizontal?.direction)) {
    return (
      <FlexContextProvider
        direction="row"
        horizontalAlignment={
          node.deltaBlock.horizontal?.horizontalAlignment ?? null
        }
        verticalAlignment={
          node.deltaBlock.horizontal?.verticalAlignment ?? null
        }
      >
        {child}
      </FlexContextProvider>
    )
  }

  if (notNullOrUndefined(node.deltaBlock.vertical?.direction)) {
    return (
      <FlexContextProvider
        direction="column"
        horizontalAlignment={
          node.deltaBlock.vertical?.horizontalAlignment ?? null
        }
        verticalAlignment={node.deltaBlock.vertical?.verticalAlignment ?? null}
      >
        {child}
      </FlexContextProvider>
    )
  }

  if (
    notNullOrUndefined(node.deltaBlock.vertical) ||
    notNullOrUndefined(node.deltaBlock.horizontal)
  ) {
    // If we are creating a new container, we need to set the flex direction
    // context to null to preserve existing measurement functionality.
    return (
      <FlexContextProvider
        direction={null}
        horizontalAlignment={null}
        verticalAlignment={null}
      >
        {child}
      </FlexContextProvider>
    )
  }

  return child
}

const ChildRenderer = (props: BlockPropsWithWidth): ReactElement => {
  const { libConfig } = useContext(LibContext)

  // Handle cycling of colors for dividers:
  assignDividerColor(props.node, useTheme())

  // Capture all the element ids to avoid rendering the same element twice
  const elementKeySet = new Set<string>()

  return (
    <>
      {props.node.children &&
        props.node.children.map((node: AppNode, index: number): ReactNode => {
          const disableFullscreenMode =
            libConfig.disableFullscreenMode || props.disableFullscreenMode

          // Base case: render a leaf node.
          if (node instanceof ElementNode) {
            // Put node in childProps instead of passing as a node={node} prop in React to
            // guarantee it doesn't get overwritten by {...childProps}.
            const childProps = {
              ...props,
              disableFullscreenMode,
              node: node as ElementNode,
            }

            const key = getElementId(node.element) || index.toString()
            // Avoid rendering the same element twice. We assume the first one is the one we want
            // because the page is rendered top to bottom, so a valid widget would be rendered
            // correctly and we assume the second one is therefore stale (or throw an error).
            // Also, our setIn logic pushes stale widgets down in the list of elements, so the
            // most recent one should always come first.
            if (elementKeySet.has(key)) {
              return null
            }

            elementKeySet.add(key)

            return <ElementNodeRenderer key={key} {...childProps} />
          }

          // Recursive case: render a block, which can contain other blocks
          // and elements.
          if (node instanceof BlockNode) {
            // Put node in childProps instead of passing as a node={node} prop in React to
            // guarantee it doesn't get overwritten by {...childProps}.
            const childProps = {
              ...props,
              disableFullscreenMode,
              node: node as BlockNode,
            }

            return <BlockNodeRenderer key={index} {...childProps} />
          }

          // We don't have any other node types!
          throw new Error(`Unrecognized AppNode: ${node}`)
        })}
    </>
  )
}

export interface ScrollToBottomVerticalBlockWrapperProps
  extends StyledVerticalBlockBorderWrapperProps {
  children: ReactNode
}

// A wrapper for Vertical Block that adds scrolling with pinned to bottom behavior.
function ScrollToBottomVerticalBlockWrapper(
  props: ScrollToBottomVerticalBlockWrapperProps
): ReactElement {
  const { border, height, children } = props
  const scrollContainerRef = useScrollToBottom()

  return (
    <StyledVerticalBlockBorderWrapper
      border={border}
      height={height}
      data-testid="stVerticalBlockBorderWrapper"
      data-test-scroll-behavior="scroll-to-bottom"
      ref={scrollContainerRef as React.RefObject<HTMLDivElement>}
    >
      {children}
    </StyledVerticalBlockBorderWrapper>
  )
}

// Currently, only VerticalBlocks will ever contain leaf elements. But this is only enforced on the
// Python side.
const VerticalBlock = (props: BlockPropsWithoutWidth): ReactElement => {
  const {
    values: [calculatedWidth],
    elementRef: wrapperElement,
    forceRecalculate,
  } = useResizeObserver(useMemo(() => ["width"], []))

  const border = props.node.deltaBlock.vertical?.border ?? false
  const height = props.node.deltaBlock.vertical?.height || undefined
  const gap = props.node.deltaBlock.vertical?.gap ?? null
  const verticalAlignment =
    props.node.deltaBlock.vertical?.verticalAlignment ?? null
  const horizontalAlignment =
    props.node.deltaBlock.vertical?.horizontalAlignment ?? null
  const wrap =
    props.node.deltaBlock.vertical?.wrap ??
    // "true" is the current behavior today and preserves it when there is no
    // explicit flex value.
    true

  const activateScrollToBottom =
    height &&
    props.node.children.some(node => {
      return (
        node instanceof BlockNode && node.deltaBlock.type === "chatMessage"
      )
    })

  // We need to update the observer whenever the scrolling is activated or deactivated
  // Otherwise, it still tries to measure the width of the old wrapper element.
  useEffect(() => {
    forceRecalculate()
  }, [forceRecalculate, activateScrollToBottom])

  // Decide which wrapper to use based on whether we need to activate scrolling to bottom
  // This is done for performance reasons, to prevent the usage of useScrollToBottom
  // if it is not needed.
  const VerticalBlockBorderWrapper = activateScrollToBottom
    ? ScrollToBottomVerticalBlockWrapper
    : StyledVerticalBlockBorderWrapper

  // Extract the user-specified key from the block ID (if provided):
  const userKey = getKeyFromId(props.node.deltaBlock.id)
  const styles = useLayoutStyles({
    width: calculatedWidth,
    element: undefined,
  })

  const propsWithNewWidth = {
    ...props,
    // TODO: CASTING TO `number` IS A HACK TO GET AROUND THE TYPE SYSTEM FOR NOW
    // All downstream components expect a number. But in this world, we are only
    // providing number | undefined to let it size itself. Any real solution will
    // update the type system everywhere, but this is just a prototype.
    ...{ width: styles.width as number },
  }

  // Widths of children autosizes to container width (and therefore window width).
  // StyledVerticalBlocks are the only things that calculate their own widths. They should never use
  // the width value coming from the parent via props.

  // To apply a border, we need to wrap the StyledVerticalBlockWrapper again, otherwise the width
  // calculation would not take the padding into consideration.
  return (
    <VerticalBlockBorderWrapper
      border={border}
      height={height}
      data-testid="stVerticalBlockBorderWrapper"
      data-test-scroll-behavior="normal"
    >
      <StyledVerticalBlockWrapper ref={wrapperElement}>
        <StyledVerticalBlock
          width={styles.width}
          gap={gap}
          verticalAlignment={verticalAlignment}
          horizontalAlignment={horizontalAlignment}
          wrap={wrap}
          className={classNames(
            "stVerticalBlock",
            convertKeyToClassName(userKey)
          )}
          data-testid="stVerticalBlock"
          style={styles}
        >
          <ChildRenderer {...propsWithNewWidth} />
        </StyledVerticalBlock>
      </StyledVerticalBlockWrapper>
    </VerticalBlockBorderWrapper>
  )
}

const HorizontalBlock = (props: BlockPropsWithWidth): ReactElement => {
  // Create a horizontal block as the parent for columns.
  // The children are always columns, but this is not checked. We just trust the Python side to
  // do the right thing, then we ask ChildRenderer to handle it.
  const gap = props.node.deltaBlock.horizontal?.gap ?? ""
  const verticalAlignment =
    props.node.deltaBlock.horizontal?.verticalAlignment ?? null
  const horizontalAlignment =
    props.node.deltaBlock.horizontal?.horizontalAlignment ?? null
  const wrap = props.node.deltaBlock.horizontal?.wrap ?? false

  return (
    <StyledHorizontalBlock
      gap={gap}
      verticalAlignment={verticalAlignment}
      horizontalAlignment={horizontalAlignment}
      wrap={wrap}
      className="stHorizontalBlock"
      data-testid="stHorizontalBlock"
    >
      <ChildRenderer {...props} />
    </StyledHorizontalBlock>
  )
}

// A container block with one of two types of layouts: vertical and horizontal.
function LayoutBlock(props: BlockPropsWithWidth): ReactElement {
  if (props.node.deltaBlock.horizontal) {
    return <HorizontalBlock {...props} />
  }

  return <VerticalBlock {...props} />
}

export default VerticalBlock
