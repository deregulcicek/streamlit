from datetime import date, datetime

import pandas as pd

import streamlit as st

st.header("💲 Predefined formats for dataframe")
todays_date = datetime.now().strftime("%Y-%m-%d")

col1, col2 = st.columns(2)

number_format = col1.selectbox(
    "Select number format",
    [
        "locale",
        "compact",
        "scientific",
        "percent",
        "dollar",
        "euro",
        "scientific",
        "compact",
        "plain",
    ],
    index=None,
)
datetime_format = col2.selectbox(
    "Select datetime format",
    [
        "locale",
        "distance",
        "relative",
    ],
    index=None,
)

st.data_editor(
    pd.DataFrame(
        {
            "num_col": [1012412.31, 0.123, 2318.41231, 102, None],
            "datetime_col": [
                datetime.fromisoformat("2018-01-31T09:24:31.123+00:00"),
                datetime.fromisoformat("2025-04-12T03:11:21.653+00:00"),
                datetime.fromisoformat(f"{todays_date}T09:00:54.231+00:00"),
                datetime.fromisoformat(f"{todays_date}T23:23:54.231+00:00"),
                None,
            ],
            "date_col": [
                date.fromisoformat("2018-01-31"),
                date.fromisoformat("2025-04-12"),
                date.fromisoformat(f"{todays_date}"),
                date.fromisoformat("2026-01-01"),
                None,
            ],
        }
    ),
    column_config={
        "num_col": st.column_config.NumberColumn(format=number_format),
        "datetime_col": st.column_config.DatetimeColumn(format=datetime_format),
        "date_col": st.column_config.DateColumn(format=datetime_format),
    },
    use_container_width=True,
    hide_index=True,
)
