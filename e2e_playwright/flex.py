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

map_df = pd.DataFrame(
    np.random.randn(1000, 2) / [50, 50] + [37.76, -122.4],
    columns=["lat", "lon"],
)

df = pd.DataFrame(np.random.randn(50, 20), columns=("col %d" % i for i in range(20)))

# Create a light blue square image
img = np.full((100, 100, 3), [173, 216, 230], dtype=np.uint8)

with st.container(
    direction="horizontal",
    gap="small",
    vertical_alignment="center",
    horizontal_alignment="distribute",
):
    # Add controls for flex container properties
    direction = st.selectbox("Direction", ["horizontal", "vertical"], index=0)
    gap = st.selectbox("Gap", ["small", "medium", "large"], index=0)
    vertical_alignment = st.selectbox(
        "Vertical alignment",
        ["top", "center", "bottom", "stretch", "distribute"],
        index=0,
    )
    horizontal_alignment = st.selectbox(
        "Horizontal alignment",
        ["start", "center", "end", "stretch", "distribute"],
        index=0,
    )
    wrap = st.checkbox("Wrap", value=True)

st.text("")
st.text("")
st.text("")

with st.echo(code_location="below"):
    flex_container = st.container(
        key="flex_container",
        direction=direction,
        gap=gap,
        vertical_alignment=vertical_alignment,
        horizontal_alignment=horizontal_alignment,
        wrap=wrap,
    )

    with flex_container:
        st.write("Flex Item 1")
        st.button("A button!")
        st.write("Flex Item 2")
        st.button("A button with a long label")

        st.write("Flex Item 3")

        with st.container(wrap=True, direction="vertical"):
            st.write("Vertical Item 1")
            st.write("Vertical Item 2")

        st.write("Flex Item 4")

        with st.container():
            st.write(
                "A container without an explicit direction set falls back to previous behavior"
            )
            st.map(map_df)

        st.image(
            img,
            caption="Square as JPEG with width=100px.",
            output_format="JPEG",
            width=100,
        )
        st.image(img, caption="Square as JPEG with no width.", output_format="JPEG")
        st.write("Flex Item 5")
        st.write("Flex Item 6")


st.divider()


st.image(img, caption="Square as JPEG with no width.", output_format="JPEG")

# Ensure widget states persist when React nodes shift
if st.button("Press me"):
    st.header("Pressed!")
c = st.container()
if c.checkbox("Check me"):
    c.title("Checked!")


st.button("A button with use_container_width=True!", use_container_width=True)
