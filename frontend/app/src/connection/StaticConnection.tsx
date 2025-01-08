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

import React, { ReactElement, useEffect } from "react"

import { ForwardMsg, ForwardMsgList } from "@streamlit/lib/src/proto"

import { ConnectionState } from "./ConnectionState"

type OnMessage = (ForwardMsg: any) => void
type OnConnectionStateChange = (
  connectionState: ConnectionState,
  errMsg?: string
) => void

interface Props {
  /** The static notebook's appID from query param */
  appId: string

  /**
   * Function called when our ConnectionState changes.
   * If the new ConnectionState is ERROR, errMsg will be defined.
   */
  onConnectionStateChange: OnConnectionStateChange

  /**
   * Function called when we receive a new message.
   */
  onMessage: OnMessage
}

// TODO: Translate this helper to pull from S3 for the given appId
async function getProtoResponse(path: string): Promise<ArrayBuffer> {
  const text = await fetch(path).then(res => res.arrayBuffer())
  return text
}

// Fetch messages for given appId
async function getAppMessages(
  appId: string,
  onMessage: OnMessage
): Promise<void> {
  const arrayBuffer = await getProtoResponse("./protos.pb")
  const forwardMsgList = ForwardMsgList.decode(new Uint8Array(arrayBuffer))

  forwardMsgList.messages.forEach(msg => {
    onMessage(msg)
  })

  return
}

export function StaticConnection({
  appId,
  onConnectionStateChange,
  onMessage,
}: Props): void {
  // Static notebooks are not connected to a server - put into connecting
  // state until assets fetched/loaded from S3
  onConnectionStateChange(ConnectionState.STATIC_CONNECTING)
  getAppMessages(appId, onMessage)
  onConnectionStateChange(ConnectionState.STATIC_CONNECTED)
}

export default StaticConnection
