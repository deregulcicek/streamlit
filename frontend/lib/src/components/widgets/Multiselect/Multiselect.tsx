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

import React, { FC, memo, useCallback, useMemo } from "react"

import { ChevronDown } from "baseui/icon"
import {
  OnChangeParams,
  Option,
  TYPE,
  Select as UISelect,
} from "baseui/select"
import without from "lodash/without"
import { isMobile } from "react-device-detect"
import { useTheme } from "@emotion/react"

import { MultiSelect as MultiSelectProto } from "@streamlit/protobuf"

import { VirtualDropdown } from "~lib/components/shared/Dropdown"
import { fuzzyFilterSelectOptions } from "~lib/components/shared/Dropdown/Selectbox"
import { Placement } from "~lib/components/shared/Tooltip"
import TooltipIcon from "~lib/components/shared/TooltipIcon"
import {
  StyledWidgetLabelHelp,
  WidgetLabel,
} from "~lib/components/widgets/BaseWidget"
import { StyledUISelect } from "~lib/components/widgets/Multiselect/styled-components"
import { EmotionTheme } from "~lib/theme"
import { labelVisibilityProtoValueToEnum } from "~lib/util/utils"
import { WidgetStateManager } from "~lib/WidgetStateManager"
import {
  useBasicWidgetState,
  ValueWithSource,
} from "~lib/hooks/useBasicWidgetState"

export interface Props {
  disabled: boolean
  element: MultiSelectProto
  widgetMgr: WidgetStateManager
  fragmentId?: string
}

type MultiselectValue = number[]

interface MultiselectOption {
  label: string
  value: string
}

const getStateFromWidgetMgr = (
  widgetMgr: WidgetStateManager,
  element: MultiSelectProto
): MultiselectValue | undefined => {
  return widgetMgr.getIntArrayValue(element)
}

const getDefaultStateFromProto = (
  element: MultiSelectProto
): MultiselectValue => {
  return element.default ?? null
}

const getCurrStateFromProto = (
  element: MultiSelectProto
): MultiselectValue => {
  return element.value ?? null
}

const updateWidgetMgrState = (
  element: MultiSelectProto,
  widgetMgr: WidgetStateManager,
  valueWithSource: ValueWithSource<MultiselectValue>,
  fragmentId?: string
): void => {
  widgetMgr.setIntArrayValue(
    element,
    valueWithSource.value,
    { fromUi: valueWithSource.fromUi },
    fragmentId
  )
}

const Multiselect: FC<Props> = props => {
  const { element, widgetMgr, fragmentId } = props

  const theme: EmotionTheme = useTheme()
  const [value, setValueWithSource] = useBasicWidgetState<
    MultiselectValue,
    MultiSelectProto
  >({
    getStateFromWidgetMgr,
    getDefaultStateFromProto,
    getCurrStateFromProto,
    updateWidgetMgrState,
    element,
    widgetMgr,
    fragmentId,
  })

  const overMaxSelections =
    element.maxSelections > 0 && value.length >= element.maxSelections

  const getNoResultsMsg = useMemo(() => {
    if (element.maxSelections === 0) {
      return "No results"
    } else if (value.length === element.maxSelections) {
      const option = element.maxSelections !== 1 ? "options" : "option"
      return `You can only select up to ${element.maxSelections} ${option}. Remove an option first.`
    }
    return "No results"
  }, [element.maxSelections, value.length])

  const valueFromState = useMemo(() => {
    return value.map(i => {
      const label = element.options[i]
      return { value: i.toString(), label }
    })
  }, [element.options, value])

  const generateNewState = useCallback(
    (data: OnChangeParams): MultiselectValue => {
      const getIndex = (): number => {
        const valueId = data.option?.value
        return parseInt(valueId, 10)
      }

      switch (data.type) {
        case "remove": {
          return without(value, getIndex())
        }
        case "clear": {
          return []
        }
        case "select": {
          return value.concat([getIndex()])
        }
        default: {
          throw new Error(`State transition is unknown: ${data.type}`)
        }
      }
    },
    [value]
  )

  const onChange = useCallback(
    (params: OnChangeParams) => {
      if (
        element.maxSelections &&
        params.type === "select" &&
        value.length >= element.maxSelections
      ) {
        return
      }
      setValueWithSource({
        value: generateNewState(params),
        fromUi: true,
      })
    },
    [element.maxSelections, generateNewState, setValueWithSource, value.length]
  )

  const filterOptions = useCallback(
    (options: readonly Option[], filterValue: string): readonly Option[] => {
      if (overMaxSelections) {
        return []
      }
      // We need to manually filter for previously selected options here
      const unselectedOptions = options.filter(
        option => !value.includes(Number(option.value))
      )

      return fuzzyFilterSelectOptions(
        unselectedOptions as MultiselectOption[],
        filterValue
      )
    },
    [overMaxSelections, value]
  )

  const { options } = element
  const disabled = options.length === 0 ? true : props.disabled
  const placeholder =
    options.length === 0 ? "No options to select." : element.placeholder
  const selectOptions: MultiselectOption[] = options.map(
    (option: string, idx: number) => {
      return {
        label: option,
        value: idx.toString(),
      }
    }
  )

  // Check if we have more than 10 options in the selectbox.
  // If that's true, we show the keyboard on mobile. If not, we hide it.
  const showKeyboardOnMobile = options.length > 10

  return (
    <div className="stMultiSelect" data-testid="stMultiSelect">
      <WidgetLabel
        label={element.label}
        disabled={disabled}
        labelVisibility={labelVisibilityProtoValueToEnum(
          element.labelVisibility?.value
        )}
      >
        {element.help && (
          <StyledWidgetLabelHelp>
            <TooltipIcon
              content={element.help}
              placement={Placement.TOP_RIGHT}
            />
          </StyledWidgetLabelHelp>
        )}
      </WidgetLabel>
      <StyledUISelect>
        <UISelect
          options={selectOptions}
          labelKey="label"
          valueKey="value"
          aria-label={element.label}
          placeholder={placeholder}
          type={TYPE.select}
          multi
          onChange={onChange}
          value={valueFromState}
          disabled={disabled}
          size={"compact"}
          noResultsMsg={getNoResultsMsg}
          filterOptions={filterOptions}
          closeOnSelect={false}
          overrides={{
            Popover: {
              props: {
                overrides: {
                  Body: {
                    style: () => ({
                      marginTop: theme.spacing.px,
                    }),
                  },
                },
              },
            },
            SelectArrow: {
              component: ChevronDown,
              props: {
                overrides: {
                  Svg: {
                    style: () => ({
                      width: theme.iconSizes.xl,
                      height: theme.iconSizes.xl,
                    }),
                  },
                },
              },
            },

            IconsContainer: {
              style: () => ({
                paddingRight: theme.spacing.sm,
              }),
            },
            ControlContainer: {
              style: {
                minHeight: theme.sizes.minElementHeight,
                // Baseweb requires long-hand props, short-hand leads to weird bugs & warnings.
                borderLeftWidth: theme.sizes.borderWidth,
                borderRightWidth: theme.sizes.borderWidth,
                borderTopWidth: theme.sizes.borderWidth,
                borderBottomWidth: theme.sizes.borderWidth,
              },
            },
            Placeholder: {
              style: () => ({
                flex: "inherit",
                opacity: "0.7",
              }),
            },
            ValueContainer: {
              style: () => ({
                paddingLeft: theme.spacing.sm,
                paddingTop: theme.spacing.none,
                paddingBottom: theme.spacing.none,
                paddingRight: theme.spacing.none,
              }),
            },
            ClearIcon: {
              props: {
                overrides: {
                  Svg: {
                    style: {
                      color: theme.colors.darkGray,
                      // setting this width and height makes the clear-icon align with dropdown arrows of other input fields
                      padding: theme.spacing.threeXS,
                      height: theme.sizes.clearIconSize,
                      width: theme.sizes.clearIconSize,
                      cursor: "pointer",
                      ":hover": {
                        fill: theme.colors.bodyText,
                      },
                    },
                  },
                },
              },
            },
            SearchIcon: {
              style: {
                color: theme.colors.darkGray,
              },
            },
            Tag: {
              props: {
                overrides: {
                  Root: {
                    style: {
                      borderTopLeftRadius: theme.radii.md,
                      borderTopRightRadius: theme.radii.md,
                      borderBottomRightRadius: theme.radii.md,
                      borderBottomLeftRadius: theme.radii.md,
                      fontSize: theme.fontSizes.md,
                      paddingLeft: theme.spacing.sm,
                      marginLeft: theme.spacing.none,
                      marginRight: theme.spacing.sm,
                      // The tag height is derived from the minElementHeight
                      // minus a top and bottom padding (2 * spacing.xs)
                      // to nicely fit into the input field.
                      height: `calc(${theme.sizes.minElementHeight} - 2 * ${theme.spacing.xs})`,
                      maxWidth: `calc(100% - ${theme.spacing.lg})`,
                      // Using !important because the alternative would be
                      // uglier: we'd have to put it under a selector like
                      // "&[role="button"]:not(:disabled)" in order to win in
                      // the order of the precendence.
                      cursor: "default !important",
                    },
                  },
                  Action: {
                    style: {
                      paddingLeft: 0,
                    },
                  },
                  ActionIcon: {
                    props: {
                      overrides: {
                        Svg: {
                          style: {
                            // The action icon should be around 0.625% of the parent font size.
                            width: "0.625em",
                            height: "0.625em",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            MultiValue: {
              props: {
                overrides: {
                  Root: {
                    style: {
                      fontSize: theme.fontSizes.sm,
                    },
                  },
                },
              },
            },
            Input: {
              props: {
                // Change the 'readonly' prop to hide the mobile keyboard if options < 10
                readOnly:
                  isMobile && showKeyboardOnMobile === false
                    ? "readonly"
                    : null,
              },
            },
            Dropdown: { component: VirtualDropdown },
          }}
        />
      </StyledUISelect>
    </div>
  )
}

export default memo(Multiselect)
