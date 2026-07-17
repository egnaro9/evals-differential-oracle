[![tests](https://github.com/egnaro9/evals-differential-oracle/actions/workflows/tests.yml/badge.svg)](https://github.com/egnaro9/evals-differential-oracle/actions/workflows/tests.yml)

# Differential Oracle — evaluating logic you can't hand-check

### ▶ [Run it in your browser](https://egnaro9.github.io/evals-differential-oracle/)

No install. The demo fetches **this repo's actual `src/`** into [Pyodide](https://pyodide.org) and runs it: edit a board and watch both nets re-judge, tick one box to swap in the deliberately-wrong implementation, then fuzz **thousands of random boards** and watch react-vs-native hit *zero* disagreements — before running the same boards against the bug and watching both nets catch it.

A tiny, runnable example of how I make agentic/game logic **prove its own
correctness** — the core idea behind the eval layer of the autonomous
development harness I built ([case study](https://github.com/egnaro9/agentic-dev-harness),
[portfolio](https://egnaro9.github.io)).

The problem: match-3 resolution has thousands of edge cases (cascades, runs,
special-gem rules) where the "right answer" isn't obvious and you can't check
them all by hand. So instead of trusting one implementation, I use two.

## Two safety nets

1. **Differential oracle** — the same logic is written **twice, independently**
   (`impl_react.py` and `impl_native.py`, different algorithms). If they ever
   disagree on a board, one of them is wrong. Agreement between two
   independently-built systems is a far stronger signal than either passing its
   own tests.
2. **Invariant checks** — the rules themselves (`invariants.py`), e.g. *a
   special gem is generated only by a direct match of 4+, never a 3* — asserted
   against thousands of random boards.

`impl_buggy.py` is a deliberately-wrong version (awards a special for runs of 3).
`tests/test_oracle_catches_bug.py` proves **both** nets catch it.

## Run it

```bash
pip install -r requirements.txt
python run_demo.py      # a short walkthrough
pytest -q               # differential + invariant tests over 6,000 random boards
```

*Built by Erik Hill — agentic systems engineer.*
