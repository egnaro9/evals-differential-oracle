"""Invariant tests: both production implementations obey the logic rules on
thousands of random boards."""
import random
from src.impl_react import resolve as react
from src.impl_native import resolve as native
from src.invariants import check_all
from tests.helpers import random_board


def test_invariants_hold_for_both_impls():
    rng = random.Random(99)
    for _ in range(3000):
        board = random_board(rng, rng.randint(1, 6), rng.randint(1, 6))
        for resolve in (react, native):
            ok, msg = check_all(board, resolve(board))
            assert ok, msg
