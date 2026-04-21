# PLAN — Phase 0 / Phase 1 working checklist

## Scope
- Package:
  - `code/sys.driver/driver-vite`
- Primary execution map:
  - `-agent/-distillation/-PLAN.md`
- Proof companion:
  - `-agent/-distillation/-PLAN.proof-matrix.md`
- Target phases:
  - Phase 0 — freeze the baseline
  - Phase 1 — separate projection from delivery without changing behavior

## Purpose
This is the **first implementation packet**.

It exists so the rewrite can begin without reopening design questions at the keyboard.

This file is intentionally narrower than `-PLAN.md`.
It answers only:
- what exactly do we do first?
- what exact files do we touch first?
- what must we not touch yet?
- what proof gates must be green before and after?
- what counts as success or failure for the first move?

## Stable doctrine for these phases
For Phase 0 and Phase 1, only one implementation doctrine matters:

**separate projection from delivery without changing behavior.**

Everything else is later.

That means this packet is **not** allowed to change:
- authority ranking
- payload breadth
- artifact identity
- wrangle launch semantics
- transport behavior
- published-boundary fixture policy

If any of those move, the first packet failed.

---

# Phase 0 — Freeze the baseline

## Goal
Start from a known-green line.
No architecture edits until the current proof lane is visibly stable.

## Exact commands
Run from:

```bash
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite
```

### Core baseline
```bash
deno task test --trace-leaks ./src/m.vite/-test/-wrangle.test.ts ./src/m.vite/-test/-build.test.ts ./src/m.vite/-test/-dev.test.ts
deno task test --trace-leaks ./src/m.vite.transport/-test/-u.load.test.ts ./src/m.vite.transport/-test/-u.resolve.test.ts
deno task test --trace-leaks ./src/m.vite/-test/-build.transitive-jsr.test.ts ./src/m.vite/-test/-build.workspace-composition.test.ts ./src/m.vite/-test/-bridge.integration.test.ts
deno task test --trace-leaks ./src/m.vite/-test.external/mod.ts
```

## Record before moving on
Capture:
- whether all commands are green
- any flaky test signal
- any non-fatal warning that appears repeatedly
- anything that looks unrelated to the bootstrap seam and should stay out of the first move

## If red
Do **not** start Phase 1 automatically.
Instead:
1. classify the failure
2. decide whether it is:
   - existing seam instability
   - unrelated noise
   - actual prerequisite blocker
   - a separate published/external validation lane that is not executing the local working tree
3. only continue after the line is back to known-green or the blocker is explicitly classified

### Temporary local external-lane posture
If the published/external lane is locally red because it is consuming the currently published package rather than the local working tree, that lane may be temporarily skipped/classified for the duration of the initial local refactor move.

That is allowed only under these conditions:
- the lane remains explicitly documented as serious and temporary
- internal/local proof gates stay green
- the external published lane is re-enabled and revalidated after the local refactor move is clean

## Phase 0 success condition
- all baseline commands green
- no unclassified red state remains

## Phase 0 TMIND 1
- are we beginning from earned proof rather than from planning momentum?

## Phase 0 TMIND 2
- are we refusing to fix unrelated noise before the seam split?

## Phase 0 BMIND review
- if the line is not visibly stable before Phase 1, then Phase 1 is premature

---

# Phase 1 — Separate projection from delivery without changing behavior

## Goal
Create the internal architectural boundary that later phases need:
- `Bootstrap.Project`
- `Bootstrap.Deliver`

But do so with **no intentional runtime behavior change**.

This is still the tactical Phase-1 naming.
If the seam later graduates cleanly, its more truthful long-term conceptual home is:
- `m.vite.startup`

Do **not** perform that module rename in Phase 1.

## Exact target outcome
At the end of Phase 1, the code should say clearly:
- this part discovers and projects startup authority
- this part delivers that authority to the child
- `u.bootstrap.ts` coordinates them

But operationally, the child should still behave the same as before.

---

## First-move file plan

### Required new/reshaped files for Phase 1

#### 1. `src/m.vite/u.bootstrap.project.ts`
Purpose:
- hold the current authority discovery + projection logic

Move here first:
- `source(...)`
- `sourceFromPath(...)`
- `sourceFromDenoFile(...)`
- `toStringRecord(...)`
- `sortImports(...)`
- current runtime import projection logic that is part of startup authority modeling

#### 2. `src/m.vite/u.bootstrap.deliver.ts`
Purpose:
- hold the current artifact generation + cleanup logic

Move here first:
- temp artifact creation
- module-sync shim writing
- import-map writing
- cleanup closure creation

#### 3. `src/m.vite/u.bootstrap.ts`
Target role after Phase 1:
- thin coordinator/export surface only

Expected shape:
- decides whether bootstrap seam activates
- calls project
- calls deliver
- returns the same outward result shape expected by wrangle

### Optional file for Phase 1
#### 4. `src/m.vite/u.bootstrap.t.ts`
Introduce this file only if it buys immediate clarity.
Do not force it if local internal types inside `project`/`deliver` remain cleaner for the first move.

If introduced, keep it to:
- projected startup authority model
- delivery handle/result

### Naming note
For this packet, keep `bootstrap` filenames.
That is tactical and temporary.
The seam is being split first, not conceptually renamed first.
The later graduation target is:
- `src/m.vite.startup/`

### File that should remain functionally untouched
#### 5. `src/m.vite/u.wrangle.ts`
Allowed in Phase 1:
- import path adjustments only if needed
- no semantic changes

Not allowed in Phase 1:
- launch contract changes
- permission/env changes
- config-loader changes
- bootstrap handle semantics changes

---

## Phase 1 checklist

### Step 1 — Add internal bootstrap types
- [ ] define internal projected-authority type
- [ ] define internal delivery-handle type
- [ ] keep types internal and minimal
- [ ] do not redesign semantics here; only name the existing split cleanly

### Step 2 — Extract projection logic
- [ ] move discovery/projection helpers into `u.bootstrap.project.ts`
- [ ] keep current behavior exact
- [ ] do not narrow merge policy yet
- [ ] do not narrow payload yet
- [ ] do not move package-metadata interop out yet unless required to keep compilation sane

### Step 3 — Extract delivery logic
- [ ] move artifact creation + cleanup into `u.bootstrap.deliver.ts`
- [ ] preserve current artifact behavior exactly for now
- [ ] keep random identity temporarily if needed
- [ ] do not improve delivery yet; only isolate it

### Step 4 — Thin the coordinator
- [ ] make `u.bootstrap.ts` call project then deliver
- [ ] preserve outward API shape expected by `Wrangle.command(...)`
- [ ] keep activation logic explicit

### Step 5 — Keep wrangle steady
- [ ] update imports only if necessary
- [ ] confirm `Wrangle.command(...)` behavior is unchanged

---

## Explicitly out of scope for Phase 1
These are forbidden in this packet.

### Do not change
- [ ] root + nearest authority merge policy
- [ ] whole-document payload carry-through
- [ ] random UUID delivery identity
- [ ] delivery location
- [ ] cleanup lifecycle semantics except for local relocation beneath delivery
- [ ] `--configLoader=native`
- [ ] permissions/env/write roots
- [ ] transport behavior
- [ ] bridge fixture behavior
- [ ] published-boundary fixture behavior
- [ ] perf protocol or measurement harness

### Why these are forbidden
Because Phase 1 is a **boundary clarification move**, not a redesign move.

---

## What good looks like at the code level
At the end of Phase 1, a reviewer should be able to point at the code and say:

- here is projection
- here is delivery
- here is the coordinator
- wrangle still launches the child

If instead the code still feels like one mixed bootstrap blob with a couple of extracted helpers, then the split is not yet real enough.

---

## Phase 1 proof gate
Run from:

```bash
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite
```

### Required gate
```bash
deno task test --trace-leaks ./src/m.vite/-test/-wrangle.test.ts ./src/m.vite/-test/-build.test.ts ./src/m.vite/-test/-dev.test.ts ./src/m.vite/-test/-bridge.integration.test.ts
```

### Required companion gate
```bash
deno task test --trace-leaks ./src/m.vite/-test/-build.transitive-jsr.test.ts ./src/m.vite/-test/-build.workspace-composition.test.ts
```

### Recommended published-boundary sanity gate
```bash
deno task test --trace-leaks ./src/m.vite/-test.external/mod.ts
```

## Phase 1 success condition
- required gate green
- required companion gate green
- no intentional behavior change introduced
- projection and delivery are visibly separate in the code
- wrangle still consumes the same outward bootstrap result shape

---

## Phase 1 stop conditions
Stop immediately and reassess if any of these happen.

### Stop 1
You feel pressure to change merge policy “while you are here.”

### Stop 2
You feel pressure to make delivery deterministic in the same edit.

### Stop 3
You need to touch permissions, config-loader, or transport to make the split work.

### Stop 4
You cannot explain whether a failing test is due to:
- projection movement
or
- delivery movement

That means the change set is too broad.

### Stop 5
You are tempted to fix published-boundary behavior by adding local fixture privilege.

That is off-plan.

---

## Commit-shape recommendation
Phase 1 should ideally land as either:

### Option A
One commit if the split is very small and behavior-preserving.

### Option B
Two commits if that keeps causality cleaner:
1. bootstrap internal types + projection extraction
2. delivery extraction + coordinator thinning

### Decision rule
Prefer the smaller causal unit that keeps test failures easy to classify.
Do **not** optimize for fewer commits over cleaner proof attribution.

---

## Reviewer questions for Phase 1
A good Phase 1 review should ask:

1. Did we actually separate projection from delivery, or only rename helpers?
2. Did wrangle stay functionally steady?
3. Did the phase avoid all behavior redesign?
4. Is the code now more legible without pretending the architecture is already finished?
5. Did we preserve the earned Vite 8 line while buying the exact boundary later phases need?

If any answer is “no,” Phase 1 should not be called complete.

---

## Exit artifact for Phase 1
Phase 1 is complete only when we can truthfully say:

**the code now has a real projection/delivery split, but it still behaves like the old line.**

That sentence is the exact exit artifact.

If we cannot say both halves of it, the phase is incomplete.

---

## Immediate next move after Phase 1
Do **not** jump straight into deterministic delivery redesign.
The next move after a successful Phase 1 should be:
- Phase 2 from `-PLAN.md`
  - separate interop facts from authority truth

Only after the Phase 1 and Phase 2 boundaries are real should the risky proof-world work and delivery redesign continue.

That sequencing is part of the phase contract, not a suggestion.

---

## Triple-check sequence

### First TMIND check
- This checklist is implementation-ready, not conceptual.
- It removes the biggest remaining ambiguity before keyboard contact.

### Second TMIND check
- The checklist preserves the earned line by forbidding redesign inside the split phase.
- It keeps later high-risk changes out of the first packet.

### Third TMIND check
- The success condition is crisp enough to prevent fake completion.
- That makes the checklist operationally trustworthy.

## Final BMIND review
This is the real/correct engineering assessment for the first implementation packet:
- the only thing that Phase 1 must buy is a real projection/delivery boundary while preserving behavior
- if that boundary is landed cleanly, the rest of the plan becomes much safer to execute
- if Phase 1 broadens into redesign, it will blur causality and weaken the entire rewrite posture
- this file should therefore be treated as the “go/no-go” checklist for beginning implementation at all
