"""Test grid layout functionality."""

import numpy as np

import streamlit as st

LOREM_IPSUM = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
BLACK_IMG = np.repeat(0, 601350).reshape(633, 950)

# Basic grid with equal columns
with st.expander("Basic grid - equal columns", expanded=True):
    grid = st.grid(3)
    with grid:
        st.text_input("Name")
        st.number_input("Age")
        st.selectbox("City", ["NY", "SF", "LA"])
        st.button("Submit")  # Goes to first cell of second row

# Grid with variable width columns
with st.expander("Variable-width grid", expanded=True):
    grid = st.grid([2, 1, 2])  # 2:1:2 ratio
    with grid:
        st.image(BLACK_IMG)
        st.image(BLACK_IMG)
        st.image(BLACK_IMG)

# Various grid gaps
with st.expander("Grid gap small", expanded=True):
    grid = st.grid(3, gap="small")
    with grid:
        st.image(BLACK_IMG)
        st.image(BLACK_IMG)
        st.image(BLACK_IMG)

with st.expander("Grid gap medium", expanded=True):
    grid = st.grid(3, gap="medium")
    with grid:
        st.image(BLACK_IMG)
        st.image(BLACK_IMG)
        st.image(BLACK_IMG)

with st.expander("Grid gap large", expanded=True):
    grid = st.grid(3, gap="large")
    with grid:
        st.image(BLACK_IMG)
        st.image(BLACK_IMG)
        st.image(BLACK_IMG)

# Vertical alignment
with st.expander("Vertical alignment - top", expanded=True):
    grid = st.grid(3, vertical_alignment="top")
    with grid:
        st.text_input("Text input (top)")
        st.button("Button (top)", use_container_width=True)
        st.checkbox("Checkbox (top)")

with st.expander("Vertical alignment - center", expanded=True):
    grid = st.grid(3, vertical_alignment="center")
    with grid:
        st.text_input("Text input (center)")
        st.button("Button (center)", use_container_width=True)
        st.checkbox("Checkbox (center)")

with st.expander("Vertical alignment - bottom", expanded=True):
    grid = st.grid(3, vertical_alignment="bottom")
    with grid:
        st.text_input("Text input (bottom)")
        st.button("Button (bottom)", use_container_width=True)
        st.checkbox("Checkbox (bottom)")

# Grid with borders
with st.expander("Grid with borders", expanded=True):
    grid = st.grid(3, border=True)
    with grid:
        st.metric("Temperature", "72°F", "2%")
        st.metric("Pressure", "30.2 in", "-4%")
        st.metric("Humidity", "45%", "-10%")

# Error cases
if st.button("Invalid grid spec (raises exception)"):
    st.grid(-1)  # Negative number

if st.button("Invalid gap (raises exception)"):
    st.grid(3, gap="invalid")

if st.button("Invalid vertical alignment (raises exception)"):
    st.grid(3, vertical_alignment="invalid")
