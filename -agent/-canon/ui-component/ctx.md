# Context

## Two-Phase Collaboration Loop
- Phase 1: **Epistemic / Design / Meaning-locking** — the human owns this grounding so
  the problem and intent are frozen before any task is executed.
- Phase 2: **Procedural / Execution / Patch-only** — Codex is authoritative only once Phase 1
  is complete.
- Codex MUST NOT initiate Phase 2 unless Phase 1 is explicitly declared complete.
- The handoff is intentional; freezing meaning before execution is what enables speed without erosion.
- This disciplined loop keeps the UI canon aligned with accuracy + quality + speed simultaneously.
- Always suggest a commit message at the end of a sequence. Either the explicit one given in the
  plan, or if not given, generate an appropriate, single-line summary commit message.
- Never attempt to create or amend git commits.

## Goals
- Establish a tight, reusable reference set for authoring `@sys/ui` components
  **without reinvention or stylistic drift**.
- Capture and maintain one canonical **shape**:
  - module/file layout,
  - public type surface,
  - theming contract and render conventions.
- Maintain a growing **idioms ledger**:
  - component-specific “power moves” (e.g. Sheet, Cropmarks, ErrorBoundary),
  - patterns that are *worth copying* rather than rediscovering.
- Index shared **primitives**:
  - the reusable building blocks across `ui-*` packages
  - (Color, css, Signal, DevHarness patterns, sizing helpers, etc.).
- Define a lightweight **conformance checklist**:
  - so both Codex and humans can generate new UI modules that “snap” into house style.
- Treat this as both **authoring and usage guidance**:
  - how components are *built*,
  - how they are *composed and referenced* in other modules.
- Use `@sys/ui-react-components` as the **canonical pure UI corpus**:
  - these components are intentionally system-level, host-agnostic, and pattern-dense.
