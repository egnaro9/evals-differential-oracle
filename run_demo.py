"""A 10-second walkthrough. Run:  python run_demo.py"""
from src.impl_react import resolve as react
from src.impl_native import resolve as native
from src.impl_buggy import resolve as buggy
from src.invariants import check_all


def show(board):
    return "\n".join(" ".join(str(x) for x in row) for row in board)


def main():
    board = [
        [1, 1, 1, 1, 2],   # a horizontal run of 4 -> one special
        [2, 3, 3, 3, 2],   # a horizontal run of 3 -> no special
        [2, 1, 2, 1, 2],
        [2, 1, 2, 1, 3],   # left column has a vertical run of 2s
    ]
    print("Board (0 = empty, 1..3 = colors):\n" + show(board) + "\n")
    r, n = react(board), native(board)
    print(f"React  impl -> {len(r.cleared)} cells cleared, {r.specials} special(s)")
    print(f"Native impl -> {len(n.cleared)} cells cleared, {n.specials} special(s)")
    print(f"Differential oracle: implementations agree? {r == n}\n")
    ok, msg = check_all(board, r)
    print(f"Invariants hold for react? {ok} ({msg})\n")
    b = buggy(board)
    print(f"Buggy impl  -> {b.specials} special(s)  (rule: special only from runs of 4+)")
    print(f"  caught by differential oracle? {r != b}")
    okb, msgb = check_all(board, b)
    print(f"  caught by invariant checker?   {not okb}  ({msgb})")


if __name__ == "__main__":
    main()
