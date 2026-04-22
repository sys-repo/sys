# PLAN — Phase 4 proof-world implementation shortlist

## Scope
- Package:
  - `code/sys.driver/driver-vite`
- Primary execution map:
  - `-agent/-distillation/-PLAN.md`
- Proof matrix:
  - `-agent/-distillation/-PLAN.proof-matrix.md`
- Fixture ontology:
  - `-agent/-bootstrap/13.fixture-concern-ontology.md`
- Upstream Vite source reference for narrow ownership/handoff checks if needed:
  - `/Users/phil/code/-random/vite`
- Target phase:
  - Phase 4 — add the missing proof worlds before risky redesign

## Purpose
This file converts the proof matrix into an implementation shortlist.

It is **not** another conceptual proof note.
It exists to answer:
- which proof worlds should be implemented first
- which current test files should probably absorb them
- which new test files should probably be added
- which helper/fixture files should probably be introduced or extended
- which worlds are truly gating later risky phases

This is the bridge between:
- proof-world theory
and
- actual test implementation work

---

## Stable doctrine
Phase 4 exists to enforce one rule:

**no risky redesign phase proceeds until the proof worlds for that exact risk exist in the suite as crisp, explicit, concern-first worlds.**

That means the shortlist is not optimized for:
- elegance
- minimal file count
- reusing old fixtures at any cost

It is optimized for:
- risk isolation
- proof clarity
- later-phase unlock value

And for this package, one proof-world spirit must stay explicit:
- external call-site simulation is first-class
- pure/published JSR `@sys/*` import worlds are first-class
- those worlds should carry both correctness proof and performance proof weight where practical

---

## Shortlist strategy
This shortlist is ordered by later-phase dependency, not by convenience.

### Ordering rule
Implement first the proof worlds that unblock the earliest risky redesign phase.

That means the first implementation priority is:
- deterministic delivery identity
- no-visible-residue

because those are required before Phase 5.

Then:
- payload minimality
narrowly for Phase 6.

Then:
- ranked-authority conflict
- published-boundary minimal-crutch
- startup handoff

for Phase 7.

Then:
- runtime-additions justification

for Phase 8.

And throughout:
- published-boundary performance world / harness

must exist at least as an executable protocol.

---

# Priority shortlist

## Priority 1 — Deterministic delivery identity world
### Why first
This is the most direct gate on Phase 5.
If this world does not exist, deterministic delivery redesign is operating on faith.

### Recommended implementation shape

#### Prefer extending
- `src/m.vite/-test/-wrangle.test.ts`

#### Likely new test file if needed
- `src/m.vite/-test/-bootstrap.delivery.identity.test.ts`

### Why this location
`-wrangle.test.ts` already inspects:
- import-map arg presence
- import-map payload
- cleanup behavior
- config-loader mode
- launch contract

That makes it the natural first home for proving:
- equivalent semantic input state → equivalent bootstrap handle identity
- equivalent semantic input state → equivalent command identity at the import-map boundary

### Proposed test cases
1. `build: equivalent inputs yield equivalent bootstrap handle identity`
2. `dev: equivalent inputs yield equivalent bootstrap handle identity`
3. `command identity only changes when semantic startup inputs change`

### Likely helper need
- small helper in `src/m.vite/-test/-u.bootstrap.identity.ts` or local helper inside the test file
- should capture:
  - generated bootstrap handle path
  - relevant command args
  - maybe payload digest if useful

### Must not do here
- do not redesign delivery yet
- do not narrow payload yet
- do not change merge policy yet

### Unlocks
- Phase 5

---

## Priority 2 — No-visible-residue world
### Why second
Also a hard Phase 5 gate.
The refactor cannot claim legitimate delivery if it merely moves random debris around.

### Recommended implementation shape

#### Likely new test file
- `src/m.vite/-test/-bootstrap.residue.test.ts`

#### Secondary external check if needed
- one scenario under `src/m.vite/-test.external/*`

### Why a new file
This concern is sharper than the existing wrangle/build/dev tests.
It deserves a clean dedicated world.

### Proposed test cases
1. `build: normal operation leaves no visible bootstrap residue in consumer root`
2. `dev: normal operation leaves no visible bootstrap residue in consumer root`
3. `delivery materialization, if still present, is outside the consumer-visible artifact surface`

### Likely helper need
- temp consumer root helper
- directory snapshot helper before/after
- probably small helper in `src/m.vite/-test/-u.bootstrap.residue.ts`

### Fixture guidance
Use the smallest copied fixture that still crosses the startup seam.
Do not use a giant realism fixture first.

### Unlocks
- Phase 5

---

## Priority 3 — Payload minimality world
### Why third
This is the gate for Phase 6.
Once Phase 5 is unblocked, this is the next direct risk band.

### Recommended implementation shape

#### Likely new test file
- `src/m.vite/-test/-bootstrap.payload.test.ts`

#### Existing file that may also absorb a small assertion
- `src/m.vite/-test/-wrangle.test.ts`

### Why a new file
Payload minimality is not just a launch-contract concern.
It is the direct proof surface for narrowing away whole-document carry-through.

### Proposed test cases
1. `startup payload only includes startup-relevant authority`
2. `removed broad document residue is not required for green startup`
3. `runtime additions remain explicit and subordinate in emitted payload`

### Likely helper need
- helper to read/capture the delivered payload shape
- possibly near future `u.bootstrap.project.ts` or `u.bootstrap.deliver.ts` tests

### Important note
This world is easier to land cleanly **after Phase 1** because projection and delivery will already be split.

### Unlocks
- Phase 6

---

## Priority 4 — Ranked-authority conflict world
### Why fourth
This is one of the major gates for Phase 7.
It is also one of the most important truthfulness proofs in the whole line.

### Recommended implementation shape

#### Likely new test file
- `src/m.vite/-test/-bootstrap.authority-ranking.test.ts`

#### Possible supporting fixture dir
- a new small fixture under `src/-test/` specifically for root vs nearest conflict

### Why a new file
This concern should not be buried in a broad integration test.
It needs an intentionally conflicting world.

### Proposed test cases
1. `nearest authority wins where consumer truth is primary`
2. `derived workspace authority only survives where explicitly inherited/required`
3. `broad merge fallback is not required for the ranked model to stay green`

### Likely helper need
- small fixture builder or dedicated fixture pair with:
  - root authority
  - nearest authority
  - controlled disagreement

### Fixture guidance
Keep this fixture tiny and explicit.
This should be a concern-first world, not a realism world.

### Unlocks
- Phase 7
- partly Phase 6 confidence

---

## Priority 5 — Published-boundary minimal-crutch world
### Why fifth
This is the other major Phase 7 gate.
It ensures the ranked authority rewrite does not become secretly local-only.

This priority should prefer an explicit external call-site simulation over a merely “external-ish” fixture.
If there is a choice, favor the world that more honestly stages:
- outside consumer posture
- driver invocation from that posture
- pure/published JSR `@sys/*` import use

### Recommended implementation shape

#### Prefer extending external lane
- `src/m.vite/-test.external/mod.ts`
- one or more of:
  - `-baseline.ts`
  - `-repo-generated.ts`
  - `-repo-generated.workspace.ts`
  - `-ui-baseline.ts`
  - `-ui-components.ts`

#### Likely new external scenario if current ones are too privilege-rich
- `src/m.vite/-test.external/-published-minimal-crutch.ts`

### Why external lane
The concern is published-boundary honesty.
That belongs in the external lane first.

### Proposed test cases
1. `published-boundary build stays green from an external call-site pure-JSR world without local-source alias privilege masquerading as architecture`
2. `published-boundary dev stays green from an external call-site pure-JSR world under explicitly limited local crutches`
3. `consumer-visible world remains honest about what authority is actually available`

### Likely helper need
- maybe extend existing generated fixture helpers under:
  - `u.fixture.build.ts`
  - `u.fixture.dev.ts`
  - `u.fixture.tmpl.ts`
- but avoid introducing another mega-helper unless truly necessary

### Unlocks
- Phase 7
- final published-boundary truth claims

---

## Priority 6 — Startup handoff world
### Why sixth
Also important for Phase 7, but less likely to block the first truth-model edits than the two worlds above.

### Recommended implementation shape

#### Likely new test file
- `src/m.vite/-test/-bootstrap.handoff.test.ts`

#### Could partially extend
- `src/m.vite/-test/-bridge.integration.test.ts`
- `src/m.vite/-test/-build.transitive-jsr.test.ts`

### Why a separate file is still preferable
The handoff claim is subtle.
It should be stated explicitly, not implied accidentally.

### Proposed test cases
1. `bootstrap enables startup but does not own later runtime resolution behavior`
2. `later runtime behavior still reflects upstream/runtime-owned seams`
3. `bootstrap changes do not re-contaminate app/plugin/transport ownership`

### Likely helper need
- maybe none if existing integration fixtures already expose the relevant transition
- if needed, a tiny assertion helper for startup-vs-runtime ownership checkpoints

### Unlocks
- Phase 7 confidence
- final architecture legitimacy

---

## Priority 7 — Runtime-additions justification world
### Why seventh
This is the direct gate for Phase 8.
It matters, but it is later in the risk order.

### Recommended implementation shape

#### Prefer extending
- `src/m.vite/-test/-wrangle.test.ts`

#### Possibly add
- `src/m.vite/-test/-bootstrap.runtime-additions.test.ts`

### Why start in wrangle
`-wrangle.test.ts` already asserts many runtime additions and launch facts.
It is the most natural first place to sharpen the claim from:
- “these are present”
to
- “these remain only because startup still requires them”

### Proposed test cases
1. `plain consumer startup additions include the startup-critical baseline without freezing the full incidental roster`
2. `plugin-react-sensitive additions only appear when that interop fact is present`
3. `remaining additions are explicitly startup-justified rather than broad carry-over`

### Assertion posture
Prefer invariant assertions over exact-key freezing.
This world should prove:
- startup-critical additions remain present
- interop-sensitive additions remain conditional
- arbitrary consumer dependencies are not mirrored into startup authority

It should not turn the current incidental import roster into a sacred long-term contract unless a later phase explicitly chooses that as the design.

### Unlocks
- Phase 8

---

## Priority 8 — Published-boundary performance world / harness
### Why eighth in implementation order but not in importance
This is high-value, but it can begin as a harness/protocol layer rather than a full correctness-style test first.
It should exist before the decisive delivery redesign is claimed complete.

The preferred first harness world is the same world the architecture actually cares about:
- external call-site posture
- pure/published JSR `@sys/*` imports
- driver exercised from outside the workspace privilege lane

### Recommended implementation shape

#### Protocol already exists
- `-agent/-distillation/-PLAN.perf-proof.md`

#### Next likely artifact
- a lightweight runner or note-backed harness rather than a normal unit test first

### Candidate implementation surfaces
- external scenarios under `src/m.vite/-test.external/*`
- helper harness near:
  - `src/m.vite/-test.external/u.fixture.dev.ts`
  - `src/m.vite/-test.external/u.fixture.build.ts`

### Why not jam it into ordinary unit tests first
This is not just a boolean correctness world.
It is a measured protocol world.
It needs a harness posture, not only assertions in a regular unit test.

### Proposed initial deliverable
1. one reproducible published-boundary dev measurement path using an external call-site / pure-JSR world
2. one reproducible published-boundary build measurement path using an external call-site / pure-JSR world
3. one equivalent-run posture comparison path

### Unlocks
- final performance claim
- Phase 5 validation in the target lane

---

# Candidate file map

## Existing files most likely to extend first

### `src/m.vite/-test/-wrangle.test.ts`
Use for:
- deterministic delivery identity assertions
- runtime-additions justification assertions
- maybe minimal payload assertions if very launch-handle-local

### `src/m.vite/-test/-bridge.integration.test.ts`
Use for:
- startup handoff supporting assertions
- bridge-world regression checks after boundary separation

### `src/m.vite/-test/-build.transitive-jsr.test.ts`
Use for:
- startup handoff supporting assertions
- published/transitive boundary support checks

### `src/m.vite/-test.external/mod.ts`
Use as aggregator for:
- published-boundary minimal-crutch world
- future performance scenario coverage

---

## New files most likely worth adding

### High-confidence additions
- `src/m.vite/-test/-bootstrap.delivery.identity.test.ts`
- `src/m.vite/-test/-bootstrap.residue.test.ts`
- `src/m.vite/-test/-bootstrap.payload.test.ts`
- `src/m.vite/-test/-bootstrap.authority-ranking.test.ts`
- `src/m.vite/-test/-bootstrap.handoff.test.ts`

### Medium-confidence additions
- `src/m.vite/-test/-bootstrap.runtime-additions.test.ts`
- `src/m.vite/-test.external/-published-minimal-crutch.ts`

These are candidate names, not sacred names.

---

## Helper / fixture surfaces most likely to need work

### Existing helper likely to be extended carefully
- `src/m.vite/-test/u.bridge.fixture.ts`

### Why carefully
It is already a powerful fixture world synthesizer.
It should not become the dumping ground for every new proof concern.
Use it when the proof world is genuinely bridge-shaped.
Do not force all new worlds through it.

### Existing external helpers likely to matter
- `src/m.vite/-test.external/u.fixture.ts`
- `src/m.vite/-test.external/u.fixture.build.ts`
- `src/m.vite/-test.external/u.fixture.dev.ts`

### New tiny helpers that may be justified
- residue inspection helper
- delivery identity capture helper
- authority-conflict fixture helper

### Helpers to avoid unless proven necessary
- new mega-fixture synthesizer
- a single universal proof-world builder that hides all concern boundaries

---

# Recommended implementation order inside Phase 4

## Batch A — hard gate for Phase 5
1. deterministic delivery identity world
2. no-visible-residue world
3. performance harness/protocol becomes runnable on at least one published-boundary scenario

## Batch B — hard gate for Phase 6 / 7
4. payload minimality world
5. ranked-authority conflict world
6. published-boundary minimal-crutch world
7. startup handoff world

## Batch C — hard gate for Phase 8
8. runtime-additions justification world

This is the correct order.

---

# What not to do while implementing the shortlist

## 1. Do not build giant realism fixtures for the small explicit worlds
Especially not for:
- authority conflict
- deterministic identity
- no residue

Those should be small and surgical.

## 2. Do not hide new concerns inside existing broad tests without renaming the proof world
If a world is important enough to gate a later phase, its identity should be visible.

## 3. Do not force all new proof worlds through `u.bridge.fixture.ts`
Some worlds are not bridge worlds.
Respect that.

## 4. Do not confuse the performance harness with ordinary unit-test semantics
Treat it as a protocol-backed proof surface.

## 5. Do not let Phase 4 become a fixture architecture rewrite
The goal is enough explicit proof worlds to unlock risky redesign, not to perfect the fixture system first.

---

# Exit criteria for the shortlist
This shortlist has done its job when a reviewer can say:

1. I know which proof world gets built first.
2. I know which existing files are the best first landing places.
3. I know which worlds deserve their own dedicated test files.
4. I know which helper/fixture surfaces are likely to change.
5. I know which later risky phase each proof world unlocks.

If those are all true, this shortlist is sufficient.

---

## Triple-check sequence

### First TMIND check
- This note translates the proof matrix into likely implementation landing zones.
- It is concrete enough to guide real test work, not just theory.

### Second TMIND check
- The shortlist preserves concern-first proof worlds instead of collapsing back into folder-first thinking.
- It also preserves the risk ordering from the main plan.

### Third TMIND check
- The output is intentionally a shortlist, not a fake certainty document.
- It gives enough direction to start without pretending every filename decision is already metaphysically fixed.

## Final BMIND review
This is the real/correct engineering assessment for the Phase 4 shortlist:
- the missing proof worlds are now concrete enough to implement in a disciplined order
- the highest-value early additions are deterministic identity, no visible residue, and a runnable published-boundary performance harness, because those directly gate delivery redesign and the intent-level performance claim
- the most truth-critical later additions are ranked authority conflict and published-boundary minimal-crutch worlds, because those guard against replacing one fake world with another
- this file should therefore be treated as the implementation-facing companion to `-PLAN.proof-matrix.md`
