"""The differential oracle: two independently-written implementations must
agree on every board. Disagreement means one of them is wrong."""
import random
from src.impl_react import resolve as react
from src.impl_native import resolve as native
from tests.helpers import random_board


def test_react_and_native_agree():
    rng = random.Random(1234)
    for _ in range(3000):
        board = random_board(rng, rng.randint(1, 6), rng.randint(1, 6))
        assert react(board) == native(board)
