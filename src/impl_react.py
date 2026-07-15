"""Implementation A ("React build"): a straight while-scan over rows, then cols."""
from .model import MatchResult


def resolve(board):
    rows = len(board)
    cols = len(board[0]) if rows else 0
    cleared = set()
    specials = 0
    for r in range(rows):
        c = 0
        while c < cols:
            color = board[r][c]
            if color == 0:
                c += 1
                continue
            start = c
            while c < cols and board[r][c] == color:
                c += 1
            length = c - start
            if length >= 3:
                cleared.update((r, k) for k in range(start, c))
                if length >= 4:
                    specials += 1
    for c in range(cols):
        r = 0
        while r < rows:
            color = board[r][c]
            if color == 0:
                r += 1
                continue
            start = r
            while r < rows and board[r][c] == color:
                r += 1
            length = r - start
            if length >= 3:
                cleared.update((k, c) for k in range(start, r))
                if length >= 4:
                    specials += 1
    return MatchResult(frozenset(cleared), specials)
