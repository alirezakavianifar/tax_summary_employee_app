import pandas as pd
try:
    df = pd.read_excel('sample.xlsx', nrows=0)
    for c in df.columns:
        print(c)
except Exception as e:
    print(e)
