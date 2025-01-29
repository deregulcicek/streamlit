import streamlit as st

st.set_option("client.showSidebarNavigation", False)
st.write("Hello")

st.button("Click me")
st.sidebar.text_area("Text area")
