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

import numpy as np
import pandas as pd

import streamlit as st

LOREM = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce gravida convallis eros sit amet fringilla. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Sed in felis interdum, tristique lacus id, dapibus dui. Nulla quis semper mauris. Aenean efficitur tincidunt turpis vitae venenatis. "


@st.cache_data
def get_map_data():
    return pd.DataFrame(
        np.random.randn(1000, 2) / [50, 50] + [37.76, -122.4],
        columns=["lat", "lon"],
    )


map_df = get_map_data()


st.title("Flexbox use_container_width")


should_wrap = st.sidebar.checkbox("Wrap", value=True)

with st.container(direction="horizontal", wrap=should_wrap):
    st.button("Button 1 with use_container_width=True", use_container_width=True)

st.divider()


with st.container(direction="horizontal", wrap=should_wrap):
    st.write("Some text")
    st.button("Button 3 with use_container_width=True", use_container_width=True)

st.divider()

with st.container(direction="horizontal", wrap=should_wrap):
    st.write(LOREM)
    st.button("Button 2 with use_container_width=True", use_container_width=True)
    st.write(LOREM)

st.divider()

with st.container(direction="horizontal", wrap=should_wrap):
    st.map(map_df)


st.divider()

with st.container(direction="horizontal", wrap=should_wrap):
    st.write("Some text")
    st.map(map_df)


st.divider()


with st.container(direction="horizontal", wrap=should_wrap):
    st.write(LOREM)
    st.map(map_df)
    st.write(LOREM)
