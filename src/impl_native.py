"""Implementation B ("native engine"): a different algorithm — detect each run
by its start cell (a differing/absent neighbor) and extend. Independent code
path from impl_react; the differential oracle checks they never disagree."""
from .model import MatchResult


def resolve(board):
    rows = len(board)
    cols = len(board[0]) if rows else 0
    cleared = set()
    specials = 0
    for r in range(rows):
        for c in range(cols):
            color = board[r][c]
            if color == 0:
                continue
            if c == 0 or board[r][c - 1] != color:  # start of a horizontal run
                length = 0
                k = c
                while k < cols and board[r][k] == color:
                    length += 1
                    k += 1
                if length >= 3:
                    cleared.update((r, x) for x in range(c, c + length))
                    if length >= 4:
                        specials += 1
            if r == 0 or board[r - 1][c] != color:  # start of a vertical run
                length = 0
                k = r
                while k < rows and board[k][c] == color:
                    length += 1
                    k += 1
                if length >= 3:
                    cleared.update((x, c) for x in range(r, r + length))
                    if length >= 4:
                        specials += 1
    return MatchResult(frozenset(cleared), specials)
