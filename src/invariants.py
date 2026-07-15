"""Logic invariants — the rules any correct implementation must obey, checked
against a board independently of how the result was produced."""


def _runs(board):
    """Every maximal horizontal/vertical run of length >= 3: (cells, length)."""
    rows = len(board)
    cols = len(board[0]) if rows else 0
    runs = []
    for r in range(rows):
        c = 0
        while c < cols:
            color = board[r][c]
            if color == 0:
                c += 1
                continue
            s = c
            while c < cols and board[r][c] == color:
                c += 1
            if c - s >= 3:
                runs.append(([(r, k) for k in range(s, c)], c - s))
    for c in range(cols):
        r = 0
        while r < rows:
            color = board[r][c]
            if color == 0:
                r += 1
                continue
            s = r
            while r < rows and board[r][c] == color:
                r += 1
            if r - s >= 3:
                runs.append(([(k, c) for k in range(s, r)], r - s))
    return runs


def check_all(board, result):
    """Return (ok, message). Encodes the special-gem rule and cleared-cell rule."""
    runs = _runs(board)
    runs_len4 = sum(1 for _, length in runs if length >= 4)
    all_cells = set()
    for cells, _ in runs:
        all_cells.update(cells)
    # A special gem is generated only by a direct match of 4+ (never a 3).
    if result.specials != runs_len4:
        return False, f"special-source rule violated: specials={result.specials}, runs>=4={runs_len4}"
    # Cleared cells are exactly the cells belonging to runs of length >= 3.
    if set(result.cleared) != all_cells:
        return False, "cleared-cell rule violated: cleared != union of runs>=3"
    if not (0 <= result.specials <= len(runs)):
        return False, "bound rule violated: specials out of [0, #runs]"
    return True, "ok"
