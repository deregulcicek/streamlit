# Copyright (c) Streamlit Inc. (2018-2022) Snowflake Inc. (2022-2024)
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

import streamlit as st

np.random.seed(0)


def generate_sparkline_data(length=7, drift=0.05, volatility=10):
    random_changes = np.random.normal(loc=drift, scale=volatility, size=length)
    initial_value = np.random.normal(loc=50, scale=5)
    data = initial_value + np.cumsum(random_changes)
    return data.tolist()


col1, col2, col3 = st.columns(3)

with col1:
    st.metric("User", 8231, 123, border=True, sparkline=generate_sparkline_data())
    st.metric("Bugs", 200, -99, border=True, sparkline=generate_sparkline_data())
with col2:
    st.metric("Views", 19321, 1053, border=True, sparkline=generate_sparkline_data())
    st.metric("Patches", 7, 0, border=True, sparkline=generate_sparkline_data())
with col3:
    st.metric("Apps", 452, 0, border=True, sparkline=generate_sparkline_data())
    st.metric("Sign-ups", 132, 12, border=True, sparkline=generate_sparkline_data())

st.write("")
st.write("")

col1, col2, col3 = st.columns(3)

with col1:
    st.metric("User", 8231, 123, border=True)
    st.metric("Bugs", 200, -99, border=True)
with col2:
    st.metric("Views", 19321, 1053, border=True)
    st.metric("Patches", 7, 0, border=True)
with col3:
    st.metric("Apps", 452, 0, border=True)
    st.metric("Sign-ups", 132, 12, border=True)

st.write("")
st.write("")

col1, col2, col3 = st.columns(3)

with col1:
    st.metric("User", 8231, 123)
    st.metric("Bugs", 200, -99)
with col2:
    st.metric("Views", 19321, 1053)
    st.metric("Patches", 7, 0)
with col3:
    st.metric("Apps", 452, 0)
    st.metric("Sign-ups", 132, 12)


# def generate_trend_data(
#     length=30,
#     trend=0.1,
#     volatility=0.05,
#     end_trend=0.3,
#     curve_type="exponential",
#     dip_point=None,
# ):
#     x = np.linspace(0, 1, length)

#     if curve_type == "exponential":
#         trend_component = trend * np.exp(2 * x) + end_trend * x**2
#     elif curve_type == "linear":
#         trend_component = trend * x + end_trend * x
#     else:  # sigmoid
#         trend_component = trend * (1 / (1 + np.exp(-10 * (x - 0.5))))

#     # Add dip at specific point if specified
#     if dip_point:
#         dip = np.exp(-200 * (x - dip_point) ** 2)
#         trend_component = trend_component - 0.15 * dip

#     noise = np.random.normal(0, volatility, length)
#     smooth_noise = np.cumsum(noise) * volatility

#     result = trend_component + smooth_noise
#     # Normalize to 0-1 range
#     result = (result - result.min()) / (result.max() - result.min())
#     return result.tolist()


# col1, col2, col3, col4 = st.columns(4)

# with col1:
#     st.metric(
#         "Monthly active developers",
#         "362,157",
#         "-13%",
#         sparkline=generate_trend_data(
#             trend=0.6, volatility=0.02, curve_type="exponential"
#         ),
#         border=True,
#     )

# with col2:
#     st.metric(
#         "Monthly active apps",
#         "366,164",
#         "-12%",
#         sparkline=generate_trend_data(
#             trend=0.5, volatility=0.02, curve_type="exponential", dip_point=0.8
#         ),
#         border=True,
#     )

# with col3:
#     st.metric(
#         "Monthly active views",
#         "9,639,300",
#         "-18%",
#         sparkline=generate_trend_data(
#             trend=0.4, volatility=0.04, curve_type="exponential", dip_point=0.9
#         ),
#         border=True,
#     )

# with col4:
#     st.metric(
#         "Monthly active viewers",
#         "3,643,600",
#         "-9%",
#         sparkline=generate_trend_data(
#             trend=0.3, volatility=0.02, curve_type="exponential", dip_point=0.85
#         ),
#         border=True,
#     )

# col1, col2, col3, _ = st.columns(4)

# with col1:
#     st.metric(
#         "Monthly active G2K companies",
#         "468",
#         "-1%",
#         sparkline=generate_trend_data(trend=0.7, volatility=0.01, curve_type="linear"),
#         border=True,
#     )

# with col2:
#     st.metric(
#         "GitHub repositories",
#         "648,734",
#         "5%",
#         sparkline=generate_trend_data(trend=0.3, volatility=0.01, curve_type="linear"),
#         border=True,
#     )

# with col3:
#     st.metric(
#         "Open bugs per day",
#         "166",
#         "-10%",
#         sparkline=generate_trend_data(
#             trend=0.5, volatility=0.08, curve_type="exponential", dip_point=0.7
#         ),
#         border=True,
#     )
