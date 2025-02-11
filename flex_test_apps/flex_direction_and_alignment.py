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
This app demonstrates valid options for horizontal and vertical alignment for different directions.
""")

valid_align = ["start", "center", "end", "stretch", "baseline"]
valid_justify = [
    "start",
    "center",
    "end",
    "space_between",
    "space_around",
    "space_evenly",
]

index = 1

for justify in valid_justify:
    st.write(f"horizontal alignment {justify}")
    with st.container(direction="horizontal", horizontal_alignment=justify):
        st.button(f"button{index}1")
        st.button(f"button{index}2")
        st.button(f"button{index}3")

    index += 1

for align in valid_align:
    st.write(f"horizontal alignment start and vertical alignment {align}")
    with st.container(
        direction="horizontal", horizontal_alignment="start", vertical_alignment=align
    ):
        st.button(f"button{index}2")
        st.write("hello")

    index += 1
