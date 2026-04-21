# PLAN — published-boundary performance proof protocol

## Scope
- Package:
  - `code/sys.driver/driver-vite`
- Primary execution plan:
  - `-agent/-distillation/-PLAN.md`
- Proof-matrix companion:
  - `-agent/-distillation/-PLAN.proof-matrix.md`
- Target boundary:
  - Vite consumers importing published JSR `@sys/*` modules in dev and build

## Purpose
This file is the narrow companion for the performance obligation in the bootstrap rewrite.

It exists because the intent note requires more than:
- cleaner architecture
- better doctrine
- greener proof on correctness alone

It also requires:
- **materially better behavior where the published-boundary consumer actually pays the cost**

That demand needs a protocol, not just a hope.

---

## Stable doctrine
This protocol serves one non-negotiable performance doctrine:

**do not claim success for the bootstrap replacement if the target published-boundary dev/build lane is still structurally cold because startup authority delivery identity keeps churning.**

And in the architecture doctrine:

**project truth, deliver stably, launch narrowly, delegate early**

must show up not only as cleaner code, but as better consumer-facing behavior.

---

## Distilled question
How do we prove that the bootstrap replacement actually improves the published-boundary consumer lane rather than merely making the architecture more elegant?

## Distilled answer
By measuring the **same consumer worlds that motivated the refactor**, under a protocol that distinguishes:
- cold vs warm posture
- dev startup vs build
- local/monorepo privilege vs published-boundary reality
- startup correctness vs startup cost

And by refusing to count architectural cleanliness as success unless the published-boundary lane is also materially improved.

---

## What this protocol is for
This protocol is for proving improvement in:
- published-boundary dev startup posture
- published-boundary build posture
- equivalent-run stability / warm-run behavior

It is **not** for proving:
- absolute global Vite performance in every environment
- upstream Vite/OXC behavior unrelated to this seam
- transport-layer performance unless bootstrap changes demonstrably affect it

That scope discipline matters.

---

## The performance claim this rewrite is allowed to make
The rewrite is allowed to claim success only if it can support a statement like:

**for the target published-boundary consumer worlds, the new bootstrap bridge removes avoidable startup churn and produces materially better dev/build behavior than the rescue-shaped line, especially across equivalent repeated runs.**

That is the claim.
Nothing broader should be implied.

---

# Measurement worlds

## World A — Published-boundary dev startup world
### Purpose
Measure the user-facing dev startup cost on the target boundary.

### Preferred scenarios
- external/generated published-boundary world from `src/m.vite/-test.external/*`
- one scenario as small as possible while still crossing the published boundary honestly
- one scenario closer to a realistic UI consumer if that remains stable enough for repeated measurement

### Required observable
- time-to-ready for `Vite.dev(...)`
- ideally measured from invocation to readiness signal / successful wait condition

### Why this matters
This is the most direct “does it still feel cold?” lane.

---

## World B — Published-boundary build world
### Purpose
Measure build posture on the same target boundary.

### Preferred scenarios
- external/generated published-boundary build world
- one transitive-JSR-sensitive world if possible

### Required observable
- elapsed build time from invocation to completed `Vite.build(...)`
- successful artifact generation remains required alongside timing

### Why this matters
The intent note explicitly includes build, not just dev.

---

## World C — Equivalent-run warm posture world
### Purpose
Measure whether equivalent repeated runs have stopped paying avoidable bootstrap churn.

### Preferred scenarios
- same published-boundary scenario run repeatedly without meaningful input changes

### Required observable
- first run vs repeated equivalent run posture
- specifically watch for whether warm/equivalent runs remain too close to cold runs in the places bootstrap identity should have improved

### Why this matters
The architecture line identified unstable delivery identity as a likely reason the current line still feels cold.
This world is the direct test of that hypothesis.

---

# Metrics

## Metric 1 — Dev ready elapsed
### Definition
Elapsed time from the start of `Vite.dev(...)` invocation to the point the dev server is considered ready.

### Acceptable readiness source
Use the same operational readiness semantics the package already trusts:
- readiness signal
- wait-for-URL success

### Why this metric matters
This is the user-facing startup cost most likely to reflect bootstrap churn.

---

## Metric 2 — Build elapsed
### Definition
Elapsed time from `Vite.build(...)` invocation to finished response.

### Why this metric matters
This is the simplest build-side target metric already close to the package API.

---

## Metric 3 — Equivalent-run delta
### Definition
The relative posture between:
- cold run
- repeated equivalent run(s)

### Why this metric matters
The rewrite is not only trying to make one run work.
It is trying to stop equivalent runs from looking unnecessarily new.

---

## Metric 4 — Bootstrap delivery identity stability
### Definition
A qualitative/structural metric paired with timing:
- does equivalent input state yield equivalent delivery handle identity?

### Why this metric matters
Timing alone is too noisy to explain causality.
This metric ties the performance claim back to the architecture claim.

---

# Protocol shape

## 1. Establish the comparison line
For each chosen scenario, compare:
- current rescue-shaped line
- rewritten line at the relevant phase checkpoint

If doing incremental comparison during the rewrite, compare:
- pre-change branch or checkpoint
- post-change branch or checkpoint

Do not compare to memory or impression.

---

## 2. Separate cold from warm
For each scenario:

### Cold posture
Run after ensuring the scenario is not benefiting from the exact prior run’s same-process startup state.
Do not over-clean globally in ways unrelated to the seam.
The point is not to simulate first install.
The point is to compare honest startup posture.

### Warm/equivalent posture
Run again with semantically unchanged inputs.
This is the posture where stable delivery identity should matter most.

---

## 3. Use repeated samples, not single anecdotes
For each scenario and posture:
- run multiple samples
- record the spread
- treat obvious noise/outliers carefully rather than pretending exact millisecond precision means truth

### Minimum recommendation
- 5 runs per posture for exploratory checks
- 7–10 runs for decisive comparison if noise is non-trivial

---

## 4. Keep observables paired
Never record timing without pairing it with:
- success/failure
- relevant output correctness
- delivery identity notes where applicable

A fast broken run is not evidence.

---

# Required scenarios
These are the minimum scenarios this protocol should cover.

## Scenario 1 — Small published-boundary dev world
### Why
Gives the cleanest signal with the least unrelated app noise.

### Must measure
- dev ready elapsed
- repeated-run posture
- delivery identity stability note

---

## Scenario 2 — Small published-boundary build world
### Why
Pairs with Scenario 1 and keeps the claim honest across build as well as dev.

### Must measure
- build elapsed
- repeated-run posture if meaningful
- artifact correctness still green

---

## Scenario 3 — Heavier published-boundary or UI world
### Why
Guards against “the improvement only exists in the toy baseline.”

### Must measure
- dev or build elapsed, depending on stability and cost
- delivery identity stability note
- output correctness

---

# Noise control rules

## 1. Do not compare across meaningfully different fixture worlds
Same scenario before/after only.

## 2. Do not treat unrelated upstream warnings as performance explanation by default
If they are causal, prove it.
Otherwise keep them out.

## 3. Do not global-cache-nuke unless the point is truly cold-start analysis
For this seam, the main value is often in equivalent-run posture, not total machine reset theatrics.

## 4. Do not mix transport changes with bootstrap perf proof
Unless transport is directly part of the compared checkpoint.

## 5. Record enough context to explain the run
At minimum note:
- scenario name
- branch/checkpoint
- cold or warm posture
- elapsed metric
- success state
- any relevant delivery identity observation

---

# Acceptance rule
This protocol should not use a fake precision threshold without data.
Instead, the acceptance rule should be:

## Required
1. correctness remains green
2. deterministic/stable delivery identity claim is visibly improved where the rewrite changed it
3. published-boundary dev/build posture is materially improved in at least the target small world and does not regress materially in the realism world
4. warm/equivalent runs show improvement consistent with the stable-delivery architecture claim

## Not acceptable
- cleaner architecture with no consumer-visible gain in the target lane
- faster local-mono-repo result but unchanged published-boundary pain
- tiny benchmark wins paired with continued random delivery identity
- selective measurement only on the most flattering scenario

---

# Suggested execution checkpoints
This protocol should be run at these plan checkpoints.

## Checkpoint A — Before Phase 5
Measure the current line to create a baseline.

## Checkpoint B — After Phase 5
Re-measure after deterministic/stable delivery changes.
This is the most important performance checkpoint.

## Checkpoint C — After Phase 7 or final coordinator landing
Re-measure after authority narrowing/ranking if those changes could affect startup cost.

## Checkpoint D — Final release candidate
Run the full minimum scenario set and keep the results with the merge posture.

---

# Suggested artifact shape for results
A simple structured note or JSON/markdown result set is enough.

For each scenario, record:
- scenario
- phase/checkpoint
- posture: cold or warm
- run count
- elapsed samples
- central tendency note
- success note
- delivery identity note
- interpretation

The point is not benchmark vanity.
The point is decision-quality evidence.

---

# Relationship to the proof matrix
This protocol is the expansion of the proof-matrix row:
- Published-boundary performance world

Use the proof matrix to know **that** the world must exist.
Use this file to know **how** to run it honestly.

---

## Explicit stop conditions
Stop and reclassify if:

1. the measured win appears only in local workspace worlds, not the target published-boundary world
2. warm-run gains are claimed but delivery identity is still unstable
3. correctness regresses while timing improves
4. the only measurable win depends on local-only crutches the architecture explicitly rejects
5. the protocol starts drifting into generic Vite benchmarking detached from the seam

If any of those happen, the proof claim is not yet earned.

---

## Distilled engineering conclusion
The bootstrap rewrite is allowed to claim performance success only if the target published-boundary lane actually gets better where the consumer feels it.

That means the right performance proof is not:
- one flattering benchmark
- one local sample
- one architectural intuition about cache stability

It is:
- published-boundary scenarios
- cold and warm posture
- correctness paired with timing
- stable-delivery causality aligned with the architecture claim

So the clean summary is:

**measure the target boundary, compare cold and equivalent runs, and require consumer-visible improvement where the refactor says it should exist.**

That is the performance proof doctrine.

---

## Triple-check sequence

### First TMIND check
- This file is a protocol, not a benchmark wish list.
- It is tightly scoped to the actual performance claim in the intent note.

### Second TMIND check
- The protocol is still architecture-aligned:
  - published boundary
  - delivery identity
  - warm-run posture
  - correctness paired with timing
- It does not drift into generic speed theater.

### Third TMIND check
- The protocol is actionable enough to run at plan checkpoints.
- It also has explicit stop conditions so weak evidence does not get promoted into architecture truth.

## Final BMIND review
This is the real/correct engineering assessment for the performance proof companion:
- the bootstrap rewrite had a real performance mandate from the start, and that mandate needed a protocol rather than a vibe
- the most important measurement worlds are published-boundary dev/build and equivalent-run posture, because that is where unstable delivery identity should have been hurting most
- this file should therefore be treated as the narrow evidence protocol for any claim that the rewrite materially improved the target consumer lane
