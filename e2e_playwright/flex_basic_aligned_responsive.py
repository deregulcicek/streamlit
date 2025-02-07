# Copyright (c) Streamlit Inc. (2018-2022) Snowflake Inc. (2022-2025)
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import streamlit as st

st.write("Some buttons that are aligned and responsive!")
with st.container(direction="horizontal", justify="start"):
    st.button("button21")
    st.button("button22")
    st.button("button23")

st.write("Some buttons with icons that are aligned and responsive!")
with st.container(direction="horizontal", justify="start"):
    st.button("", icon=":material/menu:")
    st.button("", icon=":material/view_cozy:")
    st.button("", icon=":material/expand_circle_right:")

st.write("Some widgets with different sizes and responsive!")
with st.container(direction="horizontal", justify="start", align="end", gap="medium"):
    st.button("", icon=":material/toolbar:", flex="0")
    st.selectbox("Select an option", options=["Yes", "No", "Maybe"], flex="1")
    st.slider("Confidence level", max_value=100, min_value=0, flex="3")

st.write("Some buttons that are justified left and right!")
with st.container(direction="horizontal", justify="start"):
    st.button("button31")
    st.button("button32", justify_right=True)
    st.button("button33")
