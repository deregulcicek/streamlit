import pandas as pd
import pygwalker as pyg
df = pd.read_csv('/Users/gulcicek/Desktop/31.12.2024 Mizan .csv')
walker = pyg.walk(df)
