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


import random

import numpy as np

import streamlit as st
from shared.data_mocks import SHARED_TEST_CASES

np.random.seed(0)
random.seed(0)

st.set_page_config(layout="wide")

selected_test_case = st.number_input(
    "Select test case", max_value=len(SHARED_TEST_CASES) - 1
)

# Render all test cases with st.dataframe:
test_case = SHARED_TEST_CASES[selected_test_case]
data = test_case[0]
st.markdown(str(test_case[1].expected_data_format))

# Little hack to make st.dataframe re-calculate width since
# it's a new element with a new delta path.
for _ in range(selected_test_case):
    st.empty()

st.dataframe(data, use_container_width=False)
