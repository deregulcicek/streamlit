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

import { ForwardMsgList } from "@streamlit/lib/src/proto"

import { ConnectionState } from "./ConnectionState"

type OnMessage = (ForwardMsg: any) => void
type OnConnectionStateChange = (
  connectionState: ConnectionState,
  errMsg?: string
) => void

interface Props {
  /** The static notebook's ID from query param */
  notebookId: string

  /**
   * Function called when our ConnectionState changes.
   * For a StaticConnection, used for StatusWidget
   */
  onConnectionStateChange: OnConnectionStateChange

  /**
   * Function called when we receive a new ForwardMsg
   */
  onMessage: OnMessage
}

// TODO: Translate this helper to pull from S3 for the given notebookId
async function getProtoResponse(notebookId: string): Promise<ArrayBuffer> {
  const path = `https://s3.us-west-2.amazonaws.com/notebooks.streamlit.io/${notebookId}/protos.pb`
  const text = await fetch(path).then(res => res.arrayBuffer())
  return text
}

// Fetch messages for given notebookId
async function getAppMessages(
  notebookId: string,
  onMessage: OnMessage
): Promise<void> {
  const arrayBuffer = await getProtoResponse(notebookId)
  const forwardMsgList = ForwardMsgList.decode(new Uint8Array(arrayBuffer))

  forwardMsgList.messages.forEach(msg => {
    onMessage(msg)
  })

  return
}

export function StaticConnection({
  notebookId,
  onConnectionStateChange,
  onMessage,
}: Props): void {
  // Static notebooks are not connected to a server - put into connecting
  // state until assets fetched/loaded from S3
  onConnectionStateChange(ConnectionState.STATIC_CONNECTING)

  // Fetches ForwardMsg protos and dispatches them to App.tsx's
  // handleMessage to replicate the app
  getAppMessages(notebookId, onMessage)

  // Once protos are fetched & dispatched, we are connected
  onConnectionStateChange(ConnectionState.STATIC_CONNECTED)
}

export default StaticConnection
