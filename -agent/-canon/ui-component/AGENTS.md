# AGENTS.md — System UI Component Canon (Scoped)

This file defines **executable rules** for authoring, refactoring, and reviewing
**@sys UI components** as a category.

It is written for **Codex and other automated executors**.
Humans should read `ctx.md` for intent, framing, and collaboration context.

====================================================================================================

## Scope
- Applies to **system-level UI components** under the `@sys/ui-*` family.
- Covers reusable, host-agnostic, pattern-dense UI modules.
- This file **does not override** root `AGENTS.md` or `-config/-canon/*`.

### Conflict resolution
If instructions conflict:
1. Root canon (`-config/-canon/*`, root `AGENTS.md`) wins.
2. Explicit non-overridable clauses always win.
3. This file overrides local, non-canon instructions.

====================================================================================================

## Orientation (non-executable)
- Read `./ctx.md` before acting.
- `ctx.md` provides **meaning, goals, and collaboration stance**.
- `ctx.md` is **not executable instruction**.

====================================================================================================

## Mandatory reading (executable)
Before any action, you MUST read and apply:

- `./ui.component.authoring.md`
- `./ui.component.shape.md`
- `./ui.component.idioms.md`
- `./ui.component.primitives.md`

These documents define the **actual rules, invariants, and idioms**.
AGENTS.md does not restate them.

====================================================================================================

## Plan precedence (HARD RULE)
- The **plan provided by the human** is the sole authority on:
  - scope,
  - files touched,
  - steps to perform,
  - acceptance criteria.
- Canon documents:
  - constrain *how* execution occurs,
  - prevent drift,
  - provide copyable patterns,
  - but **MUST NOT** be used to infer missing steps, add features, or expand scope.
- If the plan is incomplete or ambiguous → **STOP and ask**.

====================================================================================================

## Two-Phase Collaboration Loop (HARD RULE)

All work follows this loop:

### Phase 1 — Meaning Lock (Human-owned)
- Intent, scope, files, and prohibitions are frozen.
- No execution occurs.
- Codex MUST NOT infer, invent, or extend.
- If Phase 1 is not explicitly declared complete → **STOP**.

### Phase 2 — Execution (Codex-owned)
- Patch-only execution.
- Minimal diff.
- No stylistic drift.
- No opportunistic changes.

Phase boundaries are explicit.
Violations are a hard stop.

====================================================================================================

## Execution constraints (delegated)

All execution rules, invariants, and idioms are defined in the mandatory
canon documents listed above.

AGENTS.md **does not duplicate those rules**.
It enforces that they are applied.

If a rule is violated:
- execution must stop,
- the violation must be reported,
- no compensating or “fix-forward” changes may be made.

====================================================================================================

## Git discipline (CRITICAL)
- You MUST **never** create, amend, or finalize git commits.
- You MAY:
  - inspect history,
  - diff changes,
  - stage files,
  - suggest commit messages.
- You MUST:
  - suggest a single-line commit message at the end of a completed sequence.
- The human performs all commits.

This preserves the review and control boundary.

====================================================================================================

## Failure & uncertainty rule
If at any point:
- intent is unclear,
- a rule conflicts,
- a public type surface is ambiguous,

→ **STOP immediately and ask**.
Do not guess.
Do not proceed.

====================================================================================================

## Prime directive
Accuracy, quality, and speed are achieved **together**
by obeying structure, not by improvisation.

This file is law.
