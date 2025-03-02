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

st.set_page_config(page_title="Toolbar Test")

# Sample data for the pagination
total_items = 155
items_per_page = 10
current_page = 2
total_pages = 16
start_item = (current_page - 1) * items_per_page + 1
end_item = min(current_page * items_per_page, total_items)

# Single horizontal container with all elements
with st.container(direction="horizontal", horizontal_alignment="left"):
    # Left side elements
    st.selectbox("", [10, 25, 50, 100], label_visibility="collapsed")
    st.write(f"{start_item} - {end_item} of {total_items} items")

    # Spacer in the middle
    st.space()

    # Right side elements
    st.write("Page")
    st.number_input(
        "",
        min_value=1,
        max_value=total_pages,
        value=current_page,
        step=1,
        label_visibility="collapsed",
    )

    # Use the correct Material Icons format
    prev_button = st.button("", icon=":material/navigate_before:", help="Previous page")
    next_button = st.button("", icon=":material/navigate_next:", help="Next page")

    st.write(f"of {total_pages} pages")
