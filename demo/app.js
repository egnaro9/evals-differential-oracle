// Runs this repo's actual source in the browser via Pyodide. The .py files are
// fetched from the site (CI copies src/ verbatim from main), written into the
// interpreter's filesystem, and imported — so what you're driving below is the
// same code `pytest` runs, not a JS port of it.

const $ = (id) => document.getElementById(id);
const setStatus = (t, s) => { $("statusText").textContent = t; $("status").className = "status" + (s ? " " + s : ""); };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const SRC = ["__init__.py", "model.py", "impl_react.py", "impl_native.py", "impl_buggy.py", "invariants.py"];
const COLORS = { 0: "transparent", 1: "#e05c5c", 2: "#5b8dd6", 3: "#5cb87a" };

// The demo board from run_demo.py: a run of 4 (one special) and a run of 3 (none).
let board = [
  [1, 1, 1, 1, 2],
  [2, 3, 3, 3, 2],
  [2, 1, 2, 1, 2],
  [2, 1, 2, 1, 3],
];
let py = null;
let sabotaged = false;

async function boot() {
  try {
    setStatus("Booting Python (WebAssembly)…");
    py = await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v314.0.2/full/" });

    setStatus("Loading this repo's source…");
    py.FS.mkdir("/oracle");
    py.FS.mkdir("/oracle/src");
    for (const f of SRC) {
      const text = await (await fetch(`./src/${f}`)).text();
      py.FS.writeFile(`/oracle/src/${f}`, text);
    }

    await py.runPythonAsync(`
import sys, json, random
sys.path.insert(0, "/oracle")

from src.impl_react import resolve as react
from src.impl_native import resolve as native
from src.impl_buggy import resolve as buggy
from src.invariants import check_all

def _res(r):
    return {"cleared": sorted(list(r.cleared)), "specials": r.specials}

def judge(board_json, use_buggy):
    """Run both nets over one board. Nothing here decides correctness itself —
    it asks the two implementations and the invariant checker."""
    board = json.loads(board_json)
    r = react(board)
    other = buggy(board) if use_buggy else native(board)

    agree = (r == other)                       # differential oracle: exact equality
    ok, msg = check_all(board, other)          # invariants: independent of both impls

    return json.dumps({
        "react": _res(r),
        "other": _res(other),
        "agree": agree,
        "invariants_ok": ok,
        "invariants_msg": msg,
        "caught_by_differential": not agree,
        "caught_by_invariants": not ok,
    })

def fuzz(n, use_buggy, seed):
    """The claim on the portfolio, runnable: N random boards through both impls."""
    rng = random.Random(seed)
    disagreements = 0
    invariant_failures = 0
    first_counterexample = None
    for i in range(n):
        rows, cols = rng.randint(3, 6), rng.randint(3, 6)
        b = [[rng.randint(0, 3) for _ in range(cols)] for _ in range(rows)]
        r = react(b)
        other = buggy(b) if use_buggy else native(b)
        if r != other:
            disagreements += 1
            if first_counterexample is None:
                first_counterexample = {"board": b, "react": _res(r), "other": _res(other)}
        ok, _ = check_all(b, other)
        if not ok:
            invariant_failures += 1
    return json.dumps({
        "n": n, "disagreements": disagreements, "invariant_failures": invariant_failures,
        "first": first_counterexample,
    })
`);
    setStatus("Ready — this repo's actual source, running in your browser", "ready");
    document.querySelectorAll("button").forEach((b) => (b.disabled = false));
    renderBoard();
    await judge();
  } catch (err) {
    setStatus("Failed to boot: " + err, "err");
    console.error(err);
  }
}

function renderBoard() {
  const g = $("board");
  g.style.gridTemplateColumns = `repeat(${board[0].length}, 1fr)`;
  g.innerHTML = "";
  board.forEach((row, r) =>
    row.forEach((v, c) => {
      const b = document.createElement("button");
      b.className = "cell" + (v === 0 ? " empty" : "");
      b.style.background = COLORS[v];
      b.title = `(${r},${c}) — click to cycle colour`;
      b.addEventListener("click", async () => {
        board[r][c] = (board[r][c] + 1) % 4;   // 0 = empty, 1..3 = colours
        renderBoard();
        await judge();
      });
      g.appendChild(b);
    })
  );
}

async function judge() {
  const out = JSON.parse(await py.runPythonAsync(`judge(${JSON.stringify(JSON.stringify(board))}, ${sabotaged ? "True" : "False"})`));
  const otherName = sabotaged ? "buggy" : "native";

  $("results").innerHTML = `
    <div class="impl-row">
      <div class="impl"><div class="ilab">react impl</div>
        <div class="ival">${out.react.cleared.length} cleared · <b>${out.react.specials}</b> special(s)</div></div>
      <div class="impl ${sabotaged ? "sab" : ""}"><div class="ilab">${otherName} impl</div>
        <div class="ival">${out.other.cleared.length} cleared · <b>${out.other.specials}</b> special(s)</div></div>
    </div>

    <div class="net ${out.agree ? "ok" : "caught"}">
      <div class="nlab">Differential oracle</div>
      <div class="nval">${out.agree
        ? "✓ the two implementations agree exactly"
        : `🚩 <b>caught it</b> — react and ${otherName} disagree`}</div>
      <div class="nwhy">Compares two independent implementations. It doesn't know the rules — only that both must say the same thing.</div>
    </div>

    <div class="net ${out.invariants_ok ? "ok" : "caught"}">
      <div class="nlab">Invariant checker</div>
      <div class="nval">${out.invariants_ok
        ? "✓ all invariants hold"
        : `🚩 <b>caught it</b> — ${esc(out.invariants_msg)}`}</div>
      <div class="nwhy">Judges the result against the rules directly, independently of how it was produced. A second, differently-shaped net.</div>
    </div>`;
}

async function runFuzz(useBuggy) {
  const n = parseInt($("fuzzN").value, 10);
  const btn = useBuggy ? $("fuzzBuggy") : $("fuzzGood");
  document.querySelectorAll("button").forEach((b) => (b.disabled = true));
  btn.textContent = "running…";
  $("fuzzOut").innerHTML = `<div class="thinking">running ${n.toLocaleString()} random boards through both implementations…</div>`;
  await new Promise((r) => setTimeout(r, 30));

  const t0 = performance.now();
  const res = JSON.parse(await py.runPythonAsync(`fuzz(${n}, ${useBuggy ? "True" : "False"}, 1234)`));
  const ms = Math.round(performance.now() - t0);

  const clean = res.disagreements === 0 && res.invariant_failures === 0;
  $("fuzzOut").innerHTML = `
    <div class="fuzzbox ${useBuggy ? "caught" : clean ? "ok" : "caught"}">
      <div class="fz-head">${n.toLocaleString()} random boards · ${useBuggy ? "react vs <b>buggy</b>" : "react vs native"} · ${ms} ms</div>
      <div class="cards">
        <div class="card"><div class="k">Disagreements</div><div class="v ${res.disagreements ? "bad" : "good"}">${res.disagreements.toLocaleString()}</div></div>
        <div class="card"><div class="k">Invariant failures</div><div class="v ${res.invariant_failures ? "bad" : "good"}">${res.invariant_failures.toLocaleString()}</div></div>
        <div class="card"><div class="k">Boards clean</div><div class="v">${(n - Math.max(res.disagreements, res.invariant_failures)).toLocaleString()}</div></div>
      </div>
      <div class="fz-verdict">${
        useBuggy
          ? `🚩 <b>Both nets caught the planted bug</b> on ${res.disagreements.toLocaleString()} of ${n.toLocaleString()} boards. This is what "the test tests the test" means: a deliberately-wrong implementation must fail, or the safety net is decorative.`
          : clean
          ? `✓ <b>Zero disagreements.</b> Two independently-written implementations produced identical results on every board — and the invariant checker agreed with both. That's the claim, and you just ran it.`
          : `⚠ ${res.disagreements} disagreement(s) — a real finding.`
      }</div>
      ${res.first ? `<details><summary>first counterexample</summary><pre>${esc(JSON.stringify(res.first, null, 1))}</pre></details>` : ""}
    </div>`;
  document.querySelectorAll("button").forEach((b) => (b.disabled = false));
  btn.textContent = useBuggy ? "▶ Now run it against the buggy impl" : "▶ Run react vs native";
}

$("sabotage").addEventListener("change", async (e) => {
  sabotaged = e.target.checked;
  $("sabLabel").textContent = sabotaged
    ? "using the BUGGY implementation (special for runs of 3+)"
    : "using the native implementation";
  await judge();
});
$("reset").addEventListener("click", async () => {
  board = [[1, 1, 1, 1, 2], [2, 3, 3, 3, 2], [2, 1, 2, 1, 2], [2, 1, 2, 1, 3]];
  renderBoard();
  await judge();
});
$("fuzzGood").addEventListener("click", () => runFuzz(false));
$("fuzzBuggy").addEventListener("click", () => runFuzz(true));
boot();
