/**
 * Copyright (c) Streamlit Inc. (2018-2022) Snowflake Inc. (2022-2024)
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

import React, { memo } from "react"

import { StatefulPopover as UIPopover } from "baseui/popover"
import { ChromePicker, ColorResult } from "react-color"
import { useTheme } from "@emotion/react"

import {
  StyledWidgetLabelHelpInline,
  WidgetLabel,
} from "@streamlit/lib/src/components/widgets/BaseWidget"
import TooltipIcon from "@streamlit/lib/src/components/shared/TooltipIcon"
import { Placement } from "@streamlit/lib/src/components/shared/Tooltip"
import { LabelVisibilityOptions } from "@streamlit/lib/src/util/utils"
import { EmotionTheme } from "@streamlit/lib/src/theme"

import {
  StyledChromePicker,
  StyledColorBlock,
  StyledColorPicker,
  StyledColorPreview,
  StyledColorValue,
} from "./styled-components"

export interface BaseColorPickerProps {
  disabled: boolean
  width?: number
  value: string
  showValue?: boolean
  label: string
  labelVisibility?: LabelVisibilityOptions
  onChange: (value: string) => any
  help?: string
}

const BaseColorPicker = (props: BaseColorPickerProps): React.ReactElement => {
  const {
    disabled,
    width,
    value: propValue,
    showValue,
    label,
    labelVisibility,
    onChange,
    help,
  } = props
  const [value, setValue] = React.useState(propValue)
  const theme: EmotionTheme = useTheme()

  // Reset the value when the prop value changes
  React.useEffect(() => {
    setValue(propValue)
  }, [propValue])

  // Note: This is a "local" onChange handler used to update the color preview
  // (allowing the user to click and drag). this.props.onChange is only called
  // when the ColorPicker popover is closed.
  const onColorChange = React.useCallback((color: ColorResult): void => {
    setValue(color.hex)
  }, [])

  const onColorClose = React.useCallback((): void => {
    onChange(value)
  }, [onChange, value])

  const customChromePickerStyles = {
    default: {
      picker: {
        borderRadius: theme.radii.default,
        // Remove the box shadow from the color picker component since we're already
        // applying a shadow to the popover that contains the color picker.
        boxShadow: "none",
        backgroundColor: theme.colors.background,
      },
      saturation: {
        borderRadius: `${theme.radii.default} ${theme.radii.default} 0 0`,
        // Prevent text selection while the mouse is clicked to select a color. This
        // can be annoying if you select a color and then move the mouse outside the
        // color picker.
        // We need the `as const` here to prevent a typing error (even though it
        // also works correctly without it).
        userSelect: "none" as const,
      },
      body: {
        padding: theme.spacing.xl,
      },
    },
  }

  return (
    <StyledColorPicker
      className="stColorPicker"
      data-testid="stColorPicker"
      width={width}
      disabled={disabled}
    >
      <WidgetLabel
        label={label}
        disabled={disabled}
        labelVisibility={labelVisibility}
      >
        {help && (
          <StyledWidgetLabelHelpInline>
            <TooltipIcon content={help} placement={Placement.TOP_RIGHT} />
          </StyledWidgetLabelHelpInline>
        )}
      </WidgetLabel>
      <UIPopover
        onClose={onColorClose}
        placement="bottomLeft"
        content={() => (
          <StyledChromePicker data-testid="stColorPickerPopover">
            <ChromePicker
              color={value}
              onChange={onColorChange}
              disableAlpha={true}
              styles={customChromePickerStyles}
            />
          </StyledChromePicker>
        )}
      >
        <StyledColorPreview disabled={disabled}>
          <StyledColorBlock
            data-testid="stColorPickerBlock"
            backgroundColor={value}
            disabled={disabled}
          />
          {showValue && (
            <StyledColorValue>{value.toUpperCase()}</StyledColorValue>
          )}
        </StyledColorPreview>
      </UIPopover>
    </StyledColorPicker>
  )
}

export default memo(BaseColorPicker)
