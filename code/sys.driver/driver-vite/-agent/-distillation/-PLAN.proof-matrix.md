# PLAN — proof matrix for Phase 4 bootstrap replacement worlds

## Scope
- Package:
  - `code/sys.driver/driver-vite`
- Primary rewrite plan:
  - `-agent/-distillation/-PLAN.md`
- Companion architecture notes:
  - `-agent/-bootstrap/12.final-shape-architecture-pass.md`
  - `-agent/-bootstrap/13.fixture-concern-ontology.md`
  - `-agent/-bootstrap/14.cross-pass-tmind-audit.md`

## Purpose
This file expands **Phase 4** from `-PLAN.md` into an explicit proof matrix.

It exists so the rewrite does not move into risky redesign with only vague intentions like:
- “we should probably add some tests”

Instead, it names:
- the missing proof worlds
- the concrete risks they must guard
- the likely fixture concerns they need
- the observables that make them real proof rather than scenery
- which later rewrite phases they unlock

## Stable doctrine
This proof matrix serves one implementation doctrine:

**do not change delivery identity, payload breadth, authority ranking, or startup ownership boundaries until the proof worlds for those risks exist.**

And in the broader architectural doctrine:

**project truth, deliver stably, launch narrowly, delegate early.**

The matrix is here to make those sentences enforceable.

---

## What counts as a proof world here
A proof world is not a test filename.
It is a concern bundle with a crisp observable.

A valid proof world names at least:
- consumer boundary
- authority shape
- phase under proof
- interop shape, if any
- delivery shape, if any
- expected observable
- which rewrite risk it unlocks

If one of those is missing, the test likely still contains too much accidental fixture noise.

---

## Matrix legend

### Rewrite phases unlocked
- **P5** = replace unstable delivery identity
- **P6** = narrow emitted payload
- **P7** = replace flat merge with ranked authority
- **P8** = reduce bootstrap runtime dependency projection

### Proof severity
- **Critical** = must exist before the later phase proceeds
- **High** = should exist before the later phase proceeds unless already directly covered elsewhere
- **Medium** = valuable but can land during the same phase if tightly isolated

---

# Missing proof-world matrix

## World 1 — Deterministic delivery identity world
### Why it must exist
The architecture line says delivery identity must become stable across equivalent runs.
Right now that is a central design claim, but not yet a first-class proof world.

### Concern bundle
- consumer: local or copied minimal consumer
- authority: fixed nearest/import-map authority
- phase: pre-plugin bootstrap + launch
- delivery: bootstrap handle generation
- observable: equivalent runs yield equivalent delivery identity

### Core risk guarded
- accidental retention of random artifact identity
- command identity churn masked by green startup

### Likely fixture shape
- small copied fixture root
- same exact input state across repeated runs
- explicit capture of bootstrap handle path/identity and command args

### Required observable
At minimum prove:
1. same semantic inputs → same delivery handle identity
2. same semantic inputs → same command identity at the bootstrap handle boundary

### Likely implementation surface
- `src/m.vite/-test/-wrangle.test.ts`
- possibly a dedicated bootstrap-delivery test near the new `u.bootstrap.deliver.ts`

### Unlocks
- **P5**

### Severity
- **Critical**

---

## World 2 — No-visible-residue world
### Why it must exist
The intent note and done-state both require that normal operation not leak visible bootstrap residue into consumer/package roots.
That is currently an architectural requirement, but not yet strong enough as a proof world.

### Concern bundle
- consumer: copied or generated consumer root
- authority: ordinary startup authority
- phase: build and dev startup
- delivery: any remaining materialized handle
- observable: no visible `.vite.bootstrap.*`-style debris remains in consumer/package roots during or after normal operation

### Core risk guarded
- solving deterministic delivery with a still-legible but “less random” artifact leak
- accidentally moving residue from one visible path to another

### Likely fixture shape
- temp consumer root with directory inspection before/after
- allow hidden driver-owned internal location if that is the intended endpoint
- explicitly disallow package-root bootstrap debris

### Required observable
At minimum prove:
1. consumer/package root does not gain visible bootstrap artifacts as part of normal operation
2. if delivery materialization still exists, it is outside the consumer-visible artifact surface

### Likely implementation surface
- new dedicated build/dev residue tests under `src/m.vite/-test/*`
- possibly one external/generated scenario under `src/m.vite/-test.external/*`

### Unlocks
- **P5**

### Severity
- **Critical**

---

## World 3 — Ranked-authority conflict world
### Why it must exist
The rewrite intends to replace broad root+nearest merge with explicit authority ranking.
That is too dangerous to do without a proof world that creates an actual ranking conflict.

### Concern bundle
- consumer: workspace child consumer
- authority: root authority and nearest authority intentionally differ
- phase: startup + build
- truthfulness: consumer truth must remain primary or explicitly derived
- observable: explicit ranking outcome, not broad union fallback

### Core risk guarded
- changing to “ranked authority” in prose while silently relying on broad carry-over in practice
- reintroducing flat merge under pressure without naming it

### Likely fixture shape
- one fixture with root and nearest import authority that diverge in a controlled way
- one observable that proves which mapping actually wins and why

### Required observable
At minimum prove:
1. root and nearest disagreement produces a stable explicit result
2. the result matches the declared ranking model
3. build/dev still work if and only if the ranked model actually supports the needed startup truth

### Likely implementation surface
- new authority conflict tests under `src/m.vite/-test/*`
- possibly small helper fixtures rather than a giant sample tree

### Unlocks
- **P7**
- partly **P6**

### Severity
- **Critical**

---

## World 4 — Published-boundary minimal-crutch world
### Why it must exist
Published-boundary reality is the real target boundary.
The rewrite must not preserve truth only by silently relying on local privilege or bridge-heavy fixture help.

### Concern bundle
- consumer: published-boundary or external/generated consumer
- authority: least local privilege possible
- phase: build and dev
- truthfulness: published consumer world must remain honest
- observable: startup/build work without a fake local-only answer

### Core risk guarded
- “green” results caused by local workspace privilege rather than real published-boundary correctness
- hidden fixture crutches becoming the new false architecture

### Likely fixture shape
- scenario under `src/m.vite/-test.external/*`
- as little local special-casing as possible
- explicit statement of what authority is legitimately available

### Required observable
At minimum prove:
1. published-boundary scenario starts/builds truthfully
2. green proof does not depend on local-source aliasing masquerading as the final answer

### Likely implementation surface
- `src/m.vite/-test.external/*`
- possibly a new generated external fixture variant tuned for reduced local privilege

### Unlocks
- **P7**
- validates all final-shape claims

### Severity
- **Critical**

---

## World 5 — Startup handoff world
### Why it must exist
The final architecture says bootstrap owns startup only, then upstream/runtime seams take over.
That handoff is conceptually central but not yet explicit enough as a proof world.

### Concern bundle
- consumer: any truthful build/dev consumer
- phase: startup transition into runtime/config/plugin ownership
- ownership: bootstrap early, upstream later
- observable: startup aid does not expand into broader runtime ownership

### Core risk guarded
- bootstrap creep
- later fixes accidentally turning bootstrap into a parallel runtime resolution system

### Likely fixture shape
- scenario where startup requires the bridge, but later resolution/output invariants prove runtime seams still own the later path

### Required observable
At minimum prove:
1. bootstrap enables startup
2. later config/runtime behavior still follows the expected upstream/runtime seam
3. no new bootstrap-owned behavior leaks into app/plugin/transport concerns

### Likely implementation surface
- one or two focused integration tests in `src/m.vite/-test/*`
- may partially reuse transport/build observables

### Unlocks
- architectural confidence for **P7** and **P8**

### Severity
- **High**

---

## World 6 — Payload minimality world
### Why it must exist
The rewrite intends to remove whole-document import-map carry-through and emit only startup-relevant payload.
That requires proof that broad document preservation is not secretly doing contract work.

### Concern bundle
- consumer: startup-representative consumer
- authority: known set of startup-relevant fields
- phase: startup + build/dev
- delivery: payload content inspection
- observable: reduced payload still supports the proven lane

### Core risk guarded
- hidden dependence on broad document carry-through
- accidental regressions from narrowing payload too aggressively

### Likely fixture shape
- capture/inspect the emitted delivery payload shape
- assert absence of broad carried-through residue not required by startup

### Required observable
At minimum prove:
1. minimal payload still boots the child
2. removed fields are genuinely unnecessary for the startup contract

### Likely implementation surface
- likely new tests near `u.bootstrap.project.ts` / `u.bootstrap.deliver.ts`
- plus one integration lane under build/dev

### Unlocks
- **P6**

### Severity
- **Critical**

---

## World 7 — Runtime-additions justification world
### Why it must exist
The rewrite wants to reduce hard-coded bootstrap runtime dependency lists.
That can only be done responsibly if remaining additions are justified by startup proof.

### Concern bundle
- consumer: startup-representative build/dev consumers
- interop: Vite/esbuild/plugin-react/runtime additions
- phase: startup
- observable: each remaining addition is necessary or explicitly delegated later

### Core risk guarded
- cargo-cult retention of blocker-history runtime additions
- taste-based deletion that reopens the frontier

### Likely fixture shape
- likely a combination of wrangle/bootstrap payload assertions and integration lanes
- possibly one plugin-react-sensitive world and one plain world

### Required observable
At minimum prove:
1. removal of accidental carry-over does not break startup
2. remaining additions correspond to real startup needs rather than historical residue

### Likely implementation surface
- `src/m.vite/-test/-wrangle.test.ts`
- targeted startup integration tests

### Unlocks
- **P8**

### Severity
- **High**

---

## World 8 — Published-boundary performance world
### Why it must exist
The intent note does not only demand cleaner architecture.
It demands materially better behavior for published JSR `@sys/*` consumers in Vite dev/build.

### Concern bundle
- consumer: published-boundary or external/generated consumer
- phase: dev startup and build
- delivery/cache: cold vs warm posture
- observable: the target line gets materially better where the consumer actually pays the cost

### Core risk guarded
- delivering a beautiful architecture with no consumer-visible improvement
- claiming cache/determinism wins without measuring the target lane

### Likely fixture shape
- external/generated scenarios under `src/m.vite/-test.external/*`
- explicit cold/warm run protocol
- likely separate helper harness

### Required observable
At minimum prove:
1. published-boundary dev/build lane is materially better on the target line
2. warm/equivalent runs are no longer structurally penalized by unstable delivery identity

### Likely implementation surface
- dedicated perf protocol companion
- external scenarios reused from `-test.external`

### Unlocks
- validates final done-state
- companion to **P5** and the final review

### Severity
- **High**

---

# Coverage map against later phases

## Before Phase 5
Must exist:
- World 1 — deterministic delivery identity
- World 2 — no-visible-residue
- World 8 — published-boundary performance world at least in protocol form

## Before Phase 6
Must exist:
- World 6 — payload minimality

## Before Phase 7
Must exist:
- World 3 — ranked-authority conflict
- World 4 — published-boundary minimal-crutch
- World 5 — startup handoff

## Before Phase 8
Must exist:
- World 7 — runtime-additions justification

---

# Existing proof worlds that already help
These are not replacements for the missing worlds above, but they are useful partial anchors.

## Existing anchors
- `-wrangle.test.ts`
  - launch contract, import-map/runtime assertions
- `-bridge.integration.test.ts`
  - bridge-time startup truth under build/dev
- `-build.transitive-jsr.test.ts`
  - transitive build correctness and no dev transport leak
- `-build.workspace-composition.test.ts`
  - workspace composition truth under build
- `src/m.vite/-test.external/mod.ts`
  - external/published smoke lane
- transport tests
  - distinct transport proof surface already earned

## Why they are not enough by themselves
Because they do not yet fully isolate:
- deterministic delivery identity
- no-visible-residue guarantees
- ranked authority conflict behavior
- explicit startup handoff ownership
- performance improvement protocol on the published-boundary lane

---

# Fixture-shape guidance for Phase 4
The fixture ontology already implies the right shape.
Phase 4 should prefer:

## 1. Concern-first proof builders
Prefer helpers that let a test say:
- consumer boundary
- authority mode
- phase
- expected observable

rather than only “copy this giant sample tree.”

## 2. Small targeted worlds for high-risk claims
Especially for:
- ranked authority conflict
- deterministic identity
- no residue

These should be small, explicit, and legible.

## 3. External/generated worlds where the target boundary demands it
Especially for:
- published-boundary truth
- performance

Those should use the existing external lane where possible.

## 4. No accidental transport entanglement
Do not make bootstrap proof depend on modifying the transport seam again.

---

# Phase 4 task list derived from the matrix

## Task 4.1
Land deterministic delivery identity proof world.

## Task 4.2
Land no-visible-residue proof world.

## Task 4.3
Land ranked-authority conflict proof world.

## Task 4.4
Land published-boundary minimal-crutch proof world.

## Task 4.5
Land startup handoff proof world.

## Task 4.6
Land payload minimality proof world.

## Task 4.7
Land runtime-additions justification proof world.

## Task 4.8
Land published-boundary performance proof world or, at minimum, its harness/protocol companion.

---

# Exit criteria for Phase 4
Phase 4 is complete only when:

1. all critical proof worlds above exist
2. all critical proof worlds are green
3. every later risky phase has an explicit proof world guarding its main failure mode
4. no critical later phase still depends on vague “we’ll know if it breaks” confidence

If those are not true, Phase 4 is incomplete.

---

## Triple-check sequence

### First TMIND check
- This note names proof worlds, not just test files.
- Every row is tied to a rewrite risk and a later phase.

### Second TMIND check
- The matrix stays aligned with the architecture doctrine:
  - truth
  - stable delivery
  - narrow launch
  - early delegation
- It does not invent proof worlds unrelated to the actual rewrite risks.

### Third TMIND check
- The matrix is operational because it tells the team exactly what must exist before risky phases proceed.
- That makes Phase 4 enforceable rather than aspirational.

## Final BMIND review
This is the real/correct engineering assessment for the proof matrix:
- the architecture line is already strong enough that the missing challenge is not more conceptual distillation, but making the missing proof worlds explicit before risky redesign
- the most important missing worlds are deterministic delivery identity, no visible residue, ranked authority conflict, published-boundary minimal-crutch truth, and published-boundary performance
- once those worlds exist, the later risky phases can proceed without reopening the original frontier blindly
- this file should therefore be treated as the gating companion to Phase 4 of `-PLAN.md`
