import random
from datetime import date

import numpy as np
import pandas as pd
import polars as pl

import streamlit as st

num_rows = st.number_input("Number of rows", min_value=1, max_value=1000000, value=1000)


@st.cache_data
def get_profile_dataset(number_of_items: int = 100, seed: int = 0) -> pl.DataFrame:
    MAX_UNIQUE_ROWS = 1000

    def calculate_age(born):
        today = date.today()
        return (
            today.year - born.year - ((today.month, today.day) < (born.month, born.day))
        )

    def generate_profile_data(count: int) -> list:
        from faker import Faker

        fake = Faker()
        random.seed(seed)
        Faker.seed(seed)
        np.random.seed(seed)

        return [
            {
                "name": profile["name"],
                "avatar": f"https://picsum.photos/400/200?lock={i}",
                "age": calculate_age(profile["birthdate"]),
                "gender": random.choice(["male", "female", "other", None]),
                "active": random.choice([True, False]),
                "homepage": profile["website"][0],
                "email": profile["mail"],
                # "activity": np.random.randint(2, 90, size=25),
                # "daily_activity": np.random.rand(25),
                "birthdate": profile["birthdate"],
                "status": round(random.uniform(0, 1), 2),
            }
            for i, profile in enumerate([fake.profile() for _ in range(count)])
        ]

    if number_of_items <= MAX_UNIQUE_ROWS:
        return generate_profile_data(number_of_items)

    # For larger requests, generate MAX_UNIQUE_ROWS and then sample from it
    base_data = generate_profile_data(MAX_UNIQUE_ROWS)

    # Calculate how many complete sets and remaining items needed
    complete_sets = number_of_items // MAX_UNIQUE_ROWS
    remainder = number_of_items % MAX_UNIQUE_ROWS

    final_data = base_data * complete_sets
    if remainder > 0:
        final_data.extend(random.sample(base_data, remainder))
    return final_data


st.dataframe(pd.DataFrame(get_profile_dataset(num_rows)))
st.dataframe(pl.DataFrame(get_profile_dataset(num_rows)))
