import numpy as np
import pandas as pd

from argus.split import time_split


def make_df(n=1000, seed=0):
    rng = np.random.default_rng(seed)
    df = pd.DataFrame({
        "id": np.arange(n),
        "Time": rng.permutation(n).astype(float),  # shuffled on purpose
        "Class": rng.integers(0, 2, n),
    })
    return df


def test_sizes_add_up():
    df = make_df()
    train, val, test = time_split(df)
    assert len(train) + len(val) + len(test) == len(df)


def test_proportions():
    df = make_df(1000)
    train, val, test = time_split(df)
    assert len(train) == 700
    assert len(val) == 150
    assert len(test) == 150


def test_no_overlap():
    df = make_df()
    train, val, test = time_split(df)
    ids = [set(train["id"]), set(val["id"]), set(test["id"])]
    assert ids[0].isdisjoint(ids[1])
    assert ids[0].isdisjoint(ids[2])
    assert ids[1].isdisjoint(ids[2])


def test_time_order():
    df = make_df()
    train, val, test = time_split(df)
    assert train["Time"].max() <= val["Time"].min()
    assert val["Time"].max() <= test["Time"].min()


def test_input_not_modified():
    df = make_df()
    before = df.copy()
    time_split(df)
    pd.testing.assert_frame_equal(df, before)