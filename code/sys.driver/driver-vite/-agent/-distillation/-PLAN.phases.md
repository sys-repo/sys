# PLAN — phase map

Single-line phase index:
- `phase.00`: freeze the earned proof baseline and classify any red state before architecture movement
- `phase.01`: split bootstrap into projection, delivery, and a thin coordinator without changing runtime behavior
- `phase.04`: add the missing proof worlds and runnable perf path before any risky redesign phases open
- `phase.05`: replace unstable delivery with deterministic, no-residue delivery while preserving the proven startup lane
- `phase.06`: narrow emitted startup payload to the minimum truthful authority needed for green startup
- `phase.07`: replace flat authority merging with ranked truth and harden published-boundary correctness and startup handoff
- `phase.08`: reduce bootstrap runtime additions so the bridge owns only the narrow startup surface it still truly needs

## Scope
- Package:
  - `code/sys.driver/driver-vite`
- Canonical execution blueprint:
  - `-agent/-distillation/-PLAN.md`
- Proof companions:
  - `-agent/-distillation/-PLAN.proof-matrix.md`
  - `-agent/-distillation/-PLAN.phase-4-proof-shortlist.md`
  - `-agent/-distillation/-PLAN.perf-proof.md`

## Purpose
This file is the compact operator view of the rewrite.

It is derived from `-PLAN.md`.
It does not replace the main plan.

Use this file when the need is:
- quick phase orientation
- checkpoint review
- implementation sequencing review
- phase-boundary authorization

Use `-PLAN.md` when the need is:
- exact doctrine
- detailed tasks
- proof gates
- phase-specific constraints

---

## Stable doctrine
All phases remain downstream of the same architecture sentence:

**project truth, deliver stably, launch narrowly, delegate early.**

If a phase implementation stops serving that doctrine, it is off-plan.

---

## Phase map

### `phase.00` — Freeze the baseline
#### Scope
- run the serious baseline proof set
- classify any red state before touching architecture
- refuse planning momentum as a substitute for current proof truth

#### Output
- known-green baseline
- classified starting state

#### Risk posture
- low architectural risk
- high discipline value

#### Gate
- baseline proof set green

---

### `phase.01` — Separate projection from delivery without behavior change
#### Scope
- split bootstrap into:
  - projection
  - delivery
  - thin coordinator
- keep wrangle functionally steady
- preserve the outward child-launch behavior exactly

#### Output
- real internal boundary between truth projection and delivery
- no intentional runtime behavior change

#### Risk posture
- moderate code movement
- low doctrine risk if disciplined

#### Gate
- Phase 1 proof gate green
- companion build/integration gate green

---

### `phase.04` — Add missing proof worlds before redesign
#### Scope
- implement the proof worlds required for later risky phases
- add dedicated tests where needed
- extend fixtures only where justified by concern boundaries
- make the published-boundary perf path runnable enough to support real comparison

#### Output
- concrete proof coverage for delivery identity, residue, payload, authority conflict, published-boundary truth, handoff, and later runtime-addition justification

#### Risk posture
- moderate-to-large testing/proof scope
- low architecture-change risk if kept proof-first

#### Gate
- missing proof worlds for the next risky phase exist before that phase opens

---

### `phase.05` — Make delivery deterministic and non-leaky
#### Scope
- replace unstable delivery identity
- eliminate visible bootstrap residue from consumer/package roots during normal operation
- tighten delivery location/materialization/cleanup only as needed for the new stable model

#### Output
- deterministic delivery identity across equivalent runs
- no visible bootstrap debris in normal consumer roots

#### Risk posture
- high leverage
- first major redesign phase

#### Gate
- deterministic delivery identity world green
- no-visible-residue world green
- published-boundary comparison remains honest

---

### `phase.06` — Narrow startup payload
#### Scope
- remove broad carry-through
- emit only startup-relevant authority
- keep runtime additions explicit and subordinate

#### Output
- cleaner startup-only payload
- less accidental bootstrap document carry-over

#### Risk posture
- medium-to-high leverage
- truth-preservation risk if payload is narrowed carelessly

#### Gate
- payload minimality world green
- startup still works in the required proof worlds

---

### `phase.07` — Land ranked authority and published-boundary truth
#### Scope
- replace flat merge with ranked authority
- harden published-boundary correctness
- sharpen startup handoff so bootstrap stays early and narrow

#### Output
- explicit authority ranking
- consumer-truthful startup behavior
- clearer bootstrap-to-upstream handoff

#### Risk posture
- one of the deepest truth phases
- high architecture sensitivity

#### Gate
- ranked-authority conflict world green
- published-boundary minimal-crutch world green
- startup handoff world green

---

### `phase.08` — Reduce runtime additions and bootstrap ownership
#### Scope
- remove unjustified runtime additions
- keep only the startup additions still truly required
- tighten what bootstrap owns after startup

#### Output
- smaller runtime-additions surface
- stronger alignment with upstream ownership

#### Risk posture
- deep but narrower than Phase 7
- requires careful ownership judgment

#### Gate
- runtime-additions justification world green
- no startup regression in serious proof worlds

---

## How to use this file

### Before starting a phase
Check:
- the one-line summary
- the phase scope
- the expected output
- the phase gate

### During a phase
Use `-PLAN.md` for:
- exact constraints
- task detail
- proof commands
- TMIND/BMIND review cadence

### At a phase boundary
Ask:
1. did the phase achieve its intended output?
2. did it preserve doctrine?
3. is the next phase now legitimately unlocked?

If any answer is no, stay in the current phase.

---

## Review posture
This file is intentionally compact.
It is not the place for:
- long proofs
- source audits
- implementation detail sprawl

Its job is to keep the campaign legible at a glance.
