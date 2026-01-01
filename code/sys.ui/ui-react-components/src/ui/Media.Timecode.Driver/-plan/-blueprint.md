## PLAN LOCK — BINDING CONTRACT

**Driver (Bridge + Time Authority)**
- Bridge-only: observe active deck signals (`currentTime`, `endedTick`) → dispatch reducer Inputs; execute every reducer Cmd (cmd-complete), including `deck:load` via `resolveBeatMedia`.
- Time authority: exactly one source at a time; video drives vTime when playing; **in pause window pause media and drive vTime via monotonic timer from `pauseFrom`→`pauseTo`, then rebase to video.**
- Gating & rebases: after `video:ended(active)` suppress `currentTime`→`video:time` until cmd rebase (`deck:load|seek|swap|play|pause`); missing media on active emits `runner:error` (standby may warn/skip).

---

## CONFORMANCE PROTOCOL (NON-NEGOTIABLE)

You are bound to this plan. You cannot:
- Add, remove, or rephrase any bullet above
- Introduce concepts not present in these exact words
- Defer, extend, or "enhance" scope
- Rename or relocate responsibilities
- Substitute synonyms that shift meaning ("clamp" ≠ "timer", "latch" ≠ "gate")

**Before ANY code, suggestion, or "next step":**
1. Quote the exact bullet(s) you are implementing
2. Show 1:1 mapping between your output and the quoted text
3. If no bullet covers your proposal → STOP

**If implementation requires plan change:**
State `PLAN CHANGE REQUIRED` then provide:
- `Remove:` (exact text)
- `Add:` (exact text)
- `Reason:` (one sentence)
- WAIT for human approval before proceeding

**Violations include:**
- "We could also..." / "It might be nice to..." / "For robustness..."
- Adding invariants, helpers, or layers not named above
- Claiming conformance while changing structure

**On violation:** Human will reply `DRIFT`. You must immediately revert to last conforming state and re-quote the plan.

