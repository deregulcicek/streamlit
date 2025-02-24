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

import React, { memo, ReactElement } from "react"

import classNames from "classnames"

import { Spinner as SpinnerProto } from "@streamlit/protobuf"

import StreamlitMarkdown from "~lib/components/shared/StreamlitMarkdown"

import {
  StyledSpinner,
  StyledSpinnerContainer,
  StyledSpinnerTimer,
  ThemedStyledSpinner,
} from "./styled-components"
import { formatTime } from "./utils"

export interface SpinnerProps {
  element: SpinnerProto
}

function Spinner({ element }: Readonly<SpinnerProps>): ReactElement {
  const { cache, showTime } = element
  const [elapsedTime, setElapsedTime] = React.useState(0)

  React.useEffect(() => {
    if (!showTime) return

    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 0.1)
    }, 100)

    return () => clearInterval(timer)
  }, [showTime])

  return (
    <StyledSpinner
      className={classNames({ stSpinner: true, stCacheSpinner: cache })}
      data-testid="stSpinner"
      cache={cache}
    >
      <StyledSpinnerContainer>
        <ThemedStyledSpinner />
        <StreamlitMarkdown source={element.text} allowHTML={false} />
        {showTime && (
          <StyledSpinnerTimer>{formatTime(elapsedTime)}</StyledSpinnerTimer>
        )}
      </StyledSpinnerContainer>
    </StyledSpinner>
  )
}

export default memo(Spinner)
