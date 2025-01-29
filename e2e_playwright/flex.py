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


@st.cache_data
def get_map_data():
    return pd.DataFrame(
        np.random.randn(1000, 2) / [50, 50] + [37.76, -122.4],
        columns=["lat", "lon"],
    )


map_df = get_map_data()


@st.cache_data
def get_data():
    return pd.DataFrame(
        np.random.randn(50, 20),
        columns=("col %d" % i for i in range(20)),
    )


df = get_data()

# Create a light blue square image
img = np.full((100, 100, 3), [173, 216, 230], dtype=np.uint8)

st.title("Flexbox Demo")

with st.container(
    direction="horizontal",
    gap="small",
    vertical_alignment="center",
    horizontal_alignment="distribute",
):
    # Add controls for flex container properties
    direction = st.selectbox("Direction", ["horizontal", "vertical", "None"], index=0)
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

# TODO: `st.echo` breaks the overall width of the app. Need to look into why.
# with st.echo(code_location="below"):
flex_container = st.container(
    key="flex_container",
    direction=direction if direction != "None" else None,
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

st.title("Cases to figure out")

with st.expander("`use_container_width=True`"):
    st.markdown(
        "**What should we do about `st.button` with `use_container_width=True` in a Flex container?**"
    )

    with st.container(direction="horizontal", wrap=True):
        st.button("Button 1 with use_container_width=True", use_container_width=True)
        st.button("Button 2 with use_container_width=True", use_container_width=True)

    st.divider()

    st.markdown(
        """
        **What should `st.map` set as its width in a crowded flexbox?**

        Because of `use_container_width=True`, the map should be the full width of
        the container. On the frontend, this sets it to have `flex=1`, which takes
        up the remaining space but doesn't necessarily make it full width, nor does
        it have a default width.
        """
    )

    with st.container(direction="horizontal", wrap=True):
        st.write("Some text in this container. There should be a map here ->")
        st.map(map_df)
        st.write(
            "<- There should be a map here. But there isn't because the text is so long and overflowing"
        )

    st.divider()

    st.markdown(
        """
        If you give `st.map` a defined width, it will display something, but it
        will also have `flex-shrink: 1`, so it will shrink if needed to fit in
        the flexbox container. **Do we want that behavior?**
        """
    )

    with st.container(direction="horizontal"):
        st.write("There should be a map here ->")
        st.map(map_df, width=400)
        st.write("<- There should be a map here.")

st.divider()


st.title("Debug utils")

st.write("Some text in markdown")

st.image(img, caption="Square as JPEG with no width.", output_format="JPEG")

# Ensure widget states persist when React nodes shift
if st.button("Press me"):
    st.header("Pressed!")
c = st.container()
if c.checkbox("Check me"):
    c.title("Checked!")


st.button("A button with use_container_width=True!", use_container_width=True)
