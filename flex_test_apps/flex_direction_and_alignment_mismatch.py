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

st.write("""
This app demonstrates the dependency between direction and horizontal_alignment.
""")

st.write("This is fine because the direction is horizontal")
with st.container(direction="horizontal", horizontal_alignment="space_between"):
    st.button("button11")
    st.button("button12")
    st.button("button13")

st.write("This is not fine because the directions is vertical")
with st.container(direction="vertical", horizontal_alignment="space_between"):
    st.button("button21")
    st.button("button22")
    st.button("button23")
