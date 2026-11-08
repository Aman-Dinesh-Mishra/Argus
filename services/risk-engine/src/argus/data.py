from pathlib import Path
import pandas as pd

TARGET = "Class"

def load_data(path: str | Path) -> pd.DataFrame:
    df = pd.read_csv(path)
    if TARGET not in df.columns:
        raise ValueError(f"Missing target column '{TARGET}'")
    return df

def split_xy(df: pd.DataFrame):
    return df.drop(columns=[TARGET]), df[TARGET]