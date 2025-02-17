from IPython import display

import streamlit as st

display.display_json({"a": 1, "b": 2})


st.write(display.JSON({"a": 1, "b": 2})._repr_json_())

# st.markdown(
#     display.IFrame("https://streamlit.io/", width=100, height=100)._repr_html_(),
#     unsafe_allow_html=True,
# )
# st.image(display.Image("https://www.google.fr/images/srpr/logo3w.png")._repr_png_())
st.html(
    display.Video(
        "https://archive.org/download/Sita_Sings_the_Blues/Sita_Sings_the_Blues_small.mp4"
    )._repr_html_()
)
st.write(display.Markdown("**Hello, world!**")._repr_markdown_())
st.write(display.Math("\\(E=mc^2\\)")._repr_latex_())
st.write(display.Latex("\\(E=mc^2\\)")._repr_latex_())
st.image(display.SVG("circle cx='50' cy='50' r='40' />")._repr_svg_())

st.write(display.PNG("<png>...</png>")._repr_png_())
st.write(display.JPEG("<jpeg>...</jpeg>")._repr_jpeg_())
st.write(display.Video("https://www.youtube.com/watch?v=dQw4w9WgXcQ")._repr_html_())
