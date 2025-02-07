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

st.write("justify start")
with st.container(direction="horizontal", justify="start"):
    st.button("button21")
    st.button("button22")
    st.button("button23")

# st.write("justify center")
# with st.container(direction="horizontal", justify="center"):
#     st.button("button31")
#     st.button("button32")
#     st.button("button33")

# st.write("justify end")
# with st.container(direction="horizontal", justify="end"):
#     st.button("button41")
#     st.button("button42")
#     st.button("button43")

# st.write("justify space_between")
# with st.container(direction="horizontal", justify="space_between"):
#     st.button("button51")
#     st.button("button52")
#     st.button("button53")

# st.write("justify space_around")
# with st.container(direction="horizontal", justify="space_around"):
#     st.button("button61")
#     st.button("button62")
#     st.button("button63")

# st.write("justify space_evenly")
# with st.container(direction="horizontal", justify="space_evenly"):
#     st.button("button71")
#     st.button("button72")
#     st.button("button73")

# st.write("align start")
# with st.container(direction="horizontal", align="start"):
#     st.button("button21")
#     st.write("hello")
#     st.text_area("area21")

# st.write("align center")
# with st.container(direction="horizontal", align="center"):
#     st.button("button61")
#     st.write("hello")
#     st.text_area("area61")

# st.write("align end")
# with st.container(direction="horizontal", align="end"):
#     st.button("button31")
#     st.write("hello")
#     st.text_area("area31")

# st.write("align baseline")
# with st.container(direction="horizontal", align="baseline"):
#     st.button("button41")
#     st.write("hello")
#     st.text_area("area41")

# st.write("align stretch")
# with st.container(direction="horizontal", align="stretch"):
#     st.button("button51")
#     st.write("hello")
#     st.text_area("area51")
