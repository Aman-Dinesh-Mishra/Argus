import pandas as pd

def time_split(df: pd.DataFrame, train=0.70, val=0.15, time_col="Time"):
    """Train on the past, validate and test on the future."""
    df = df.sort_values(time_col).reset_index(drop=True)
    n = len(df)
    i, j = int(n * train), int(n * (train + val))
    return df.iloc[:i], df.iloc[i:j], df.iloc[j:]