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

import React, { memo, ReactElement, useEffect, useState } from "react"

import { useTheme } from "@emotion/react"
import {
  ACCESSIBILITY_TYPE,
  PLACEMENT,
  Popover,
  TRIGGER_TYPE,
} from "baseui/popover"

import {
  EmotionTheme,
  hasLightBackgroundColor,
} from "@streamlit/lib/src/theme"
import { DynamicIcon } from "@streamlit/lib/src/components/shared/Icon"

import {
  StyledMenuDivider,
  StyledMenuList,
  StyledMenuListItem,
} from "./styled-components"

const COLUMN_KIND_FORMAT_MAPPING: Record<
  string,
  { format: string; label: string; icon: string }[]
> = {
  number: [
    {
      format: "",
      label: "Number",
      icon: ":material/123:",
    },
    {
      format: "dollar",
      label: "Dollar",
      icon: ":material/attach_money:",
    },
    {
      format: "euro",
      label: "Euro",
      icon: ":material/euro:",
    },
    {
      format: "percent",
      label: "Percent",
      icon: ":material/percent:",
    },
  ],
}

export interface ColumnMenuProps {
  // The top position of the menu
  top: number
  // The left position of the menu
  left: number
  // The kind of the column
  columnKind: string
  // Callback used to instruct the parent to close the menu
  onCloseMenu: () => void
  // Callback to sort column
  // If undefined, the sort menu item will not be shown
  onSortColumn: ((direction: "asc" | "desc") => void) | undefined
  // Whether the column is pinned
  isColumnPinned: boolean
  // Callback to pin the column
  onPinColumn: () => void
  // Callback to unpin the column
  onUnpinColumn: () => void
  // Callback to change the column format
  changeFormat?: (format: string) => void
}

/**
 * A column context menu that provides interactive features for a grid column.
 */
function ColumnMenu({
  top,
  left,
  columnKind,
  isColumnPinned,
  onPinColumn,
  onUnpinColumn,
  onCloseMenu,
  onSortColumn,
  changeFormat,
}: ColumnMenuProps): ReactElement {
  const theme: EmotionTheme = useTheme()
  const [formatMenuOpen, setFormatMenuOpen] = useState(false)
  const { colors, fontSizes, radii, fontWeights } = theme

  // Disable page scrolling while the menu is open to keep the menu und
  // column header aligned.
  // This is done by preventing defaults on wheel and touch events:
  useEffect(() => {
    function preventScroll(e: WheelEvent | TouchEvent): void {
      e.preventDefault()
    }

    const cleanup = (): void => {
      document.removeEventListener("wheel", preventScroll)
      document.removeEventListener("touchmove", preventScroll)
    }

    document.addEventListener("wheel", preventScroll, { passive: false })
    document.addEventListener("touchmove", preventScroll, { passive: false })

    return () => {
      cleanup()
    }
  }, [])

  const closeMenu = React.useCallback((): void => {
    onCloseMenu()
  }, [onCloseMenu])

  const formats = COLUMN_KIND_FORMAT_MAPPING[columnKind] || []

  return (
    <Popover
      autoFocus
      aria-label="Dataframe column menu"
      content={
        <StyledMenuList>
          {onSortColumn && (
            <>
              <StyledMenuListItem
                onClick={() => {
                  onSortColumn("asc")
                  closeMenu()
                }}
                role="menuitem"
              >
                <DynamicIcon
                  size={"base"}
                  margin="0"
                  color="inherit"
                  iconValue=":material/arrow_upward:"
                />
                Sort ascending
              </StyledMenuListItem>
              <StyledMenuListItem
                onClick={() => {
                  onSortColumn("desc")
                  closeMenu()
                }}
                role="menuitem"
              >
                <DynamicIcon
                  size={"base"}
                  margin="0"
                  color="inherit"
                  iconValue=":material/arrow_downward:"
                />
                Sort descending
              </StyledMenuListItem>
              <StyledMenuDivider />
            </>
          )}
          {isColumnPinned && (
            <StyledMenuListItem
              onClick={() => {
                onUnpinColumn()
                closeMenu()
              }}
            >
              <DynamicIcon
                size={"base"}
                margin="0"
                color="inherit"
                iconValue=":material/keep_off:"
              />
              Unpin column
            </StyledMenuListItem>
          )}
          {!isColumnPinned && (
            <StyledMenuListItem
              onClick={() => {
                onPinColumn()
                closeMenu()
              }}
            >
              <DynamicIcon
                size={"base"}
                margin="0"
                color="inherit"
                iconValue=":material/keep:"
              />
              Pin column
            </StyledMenuListItem>
          )}
          {changeFormat && formats.length > 0 && (
            <>
              <Popover
                triggerType={TRIGGER_TYPE.hover}
                returnFocus
                autoFocus
                focusLock
                isOpen={formatMenuOpen}
                onMouseEnter={() => setFormatMenuOpen(true)}
                onMouseLeave={() => setFormatMenuOpen(false)}
                content={
                  <StyledMenuList>
                    {formats.map(format => (
                      <StyledMenuListItem
                        key={format.format}
                        onClick={() => {
                          changeFormat(format.format)
                          closeMenu()
                        }}
                        role="menuitem"
                      >
                        <DynamicIcon
                          size={"base"}
                          margin="0"
                          color="inherit"
                          iconValue={format.icon}
                        />
                        {format.label}
                      </StyledMenuListItem>
                    ))}
                  </StyledMenuList>
                }
                placement={PLACEMENT.rightTop}
                showArrow={false}
                popoverMargin={2}
                overrides={{
                  Body: {
                    style: {
                      borderTopLeftRadius: radii.default,
                      borderTopRightRadius: radii.default,
                      borderBottomLeftRadius: radii.default,
                      borderBottomRightRadius: radii.default,
                      paddingTop: "0 !important",
                      paddingBottom: "0 !important",
                      paddingLeft: "0 !important",
                      paddingRight: "0 !important",
                      backgroundColor: "transparent",
                      border: `${theme.sizes.borderWidth} solid ${theme.colors.borderColor}`,
                    },
                  },
                  Inner: {
                    style: {
                      backgroundColor: hasLightBackgroundColor(theme)
                        ? colors.bgColor
                        : colors.secondaryBg,
                      color: colors.bodyText,
                      fontSize: fontSizes.sm,
                      fontWeight: fontWeights.normal,
                      paddingTop: "0 !important",
                      paddingBottom: "0 !important",
                      paddingLeft: "0 !important",
                      paddingRight: "0 !important",
                    },
                  },
                }}
              >
                <StyledMenuListItem
                  onMouseEnter={() => setFormatMenuOpen(true)}
                  onMouseLeave={() => setFormatMenuOpen(false)}
                >
                  <DynamicIcon
                    size={"base"}
                    margin="0"
                    color="inherit"
                    iconValue=":material/format_list_numbered:"
                  />
                  Change format
                </StyledMenuListItem>
              </Popover>
            </>
          )}
        </StyledMenuList>
      }
      placement={PLACEMENT.bottomRight}
      accessibilityType={ACCESSIBILITY_TYPE.menu}
      showArrow={false}
      popoverMargin={5}
      onClickOutside={!formatMenuOpen ? closeMenu : undefined}
      onEsc={closeMenu}
      overrides={{
        Body: {
          props: {
            "data-testid": "stDataFrameColumnMenu",
          },
          style: {
            // This is annoying, but a bunch of warnings get logged when the
            // shorthand version `borderRadius` is used here since the long
            // names are used by BaseWeb and mixing the two is apparently
            // bad :(
            borderTopLeftRadius: radii.default,
            borderTopRightRadius: radii.default,
            borderBottomLeftRadius: radii.default,
            borderBottomRightRadius: radii.default,

            paddingTop: "0 !important",
            paddingBottom: "0 !important",
            paddingLeft: "0 !important",
            paddingRight: "0 !important",

            backgroundColor: "transparent",
            border: `${theme.sizes.borderWidth} solid ${theme.colors.borderColor}`,
          },
        },
        Inner: {
          style: {
            backgroundColor: hasLightBackgroundColor(theme)
              ? colors.bgColor
              : colors.secondaryBg,
            color: colors.bodyText,
            fontSize: fontSizes.sm,
            fontWeight: fontWeights.normal,
            // See the long comment about `borderRadius`. The same applies here
            // to `padding`.
            paddingTop: "0 !important",
            paddingBottom: "0 !important",
            paddingLeft: "0 !important",
            paddingRight: "0 !important",
          },
        },
      }}
      // We can always set the menu to open here since the dataframe
      // component controls if its open or not by adding it to the DOM or not.
      isOpen={true}
    >
      <div
        data-testid="stDataFrameColumnMenuTarget"
        style={{
          // This is an invisible div that's used to position the tooltip.
          // The position is provided from outside via the `top` and `left` properties.
          // This a workaround for the fact that BaseWeb's Popover  doesn't support
          // positioning to a virtual position and always requires a target
          // component for positioning.
          position: "fixed",
          top,
          left,
          visibility: "hidden",
        }}
      ></div>
    </Popover>
  )
}

export default memo(ColumnMenu)
