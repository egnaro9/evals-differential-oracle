"""Shared result type. Two cleared-cell sets + special-gem counts are 'equal'
only if they match exactly — that exact-equality is what the differential
oracle leans on."""
from dataclasses import dataclass
from typing import FrozenSet, Tuple

Cell = Tuple[int, int]


@dataclass(frozen=True)
class MatchResult:
    cleared: FrozenSet[Cell]  # every cell that is part of a match (run length >= 3)
    specials: int             # special gems generated: one per run of length >= 4
