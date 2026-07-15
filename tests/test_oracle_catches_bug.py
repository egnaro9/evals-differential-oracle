"""Proof both safety nets work: against a deliberately-buggy implementation,
the differential oracle disagrees AND the invariant checker flags it."""
import random
from src.impl_react import resolve as react
from src.impl_buggy import resolve as buggy
from src.invariants import check_all
from tests.helpers import random_board


def test_both_nets_catch_the_planted_bug():
    rng = random.Random(7)
    caught_by_differential = False
    caught_by_invariants = False
    for _ in range(3000):
        board = random_board(rng, rng.randint(1, 6), rng.randint(1, 6))
        if react(board) != buggy(board):
            caught_by_differential = True
        ok, _ = check_all(board, buggy(board))
        if not ok:
            caught_by_invariants = True
        if caught_by_differential and caught_by_invariants:
            break
    assert caught_by_differential, "differential oracle missed the bug"
    assert caught_by_invariants, "invariant checker missed the bug"
