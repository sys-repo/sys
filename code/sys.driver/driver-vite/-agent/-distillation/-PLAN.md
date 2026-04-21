# PLAN — implementation blueprint / task graph for the Vite 8 bootstrap replacement

## Scope
- Package:
  - `code/sys.driver/driver-vite`
- Primary frontier:
  - `src/m.vite/u.bootstrap.ts`
- Direct command seam:
  - `src/m.vite/u.wrangle.ts`
- Companion proof surface:
  - `src/m.vite/-test/*`
  - `src/m.vite/-test.external/*`
  - `src/m.vite.config/-test/*`
  - `src/m.vite.config.workspace/-test/*`
  - `src/m.vite.transport/-test/*`
- Upstream source reference when narrow Vite seam reading is needed:
  - `/Users/phil/code/-random/vite`
- Architecture sources:
  - `-agent/vite8.bootstrap-refactor.intent.md`
  - `-agent/-bootstrap/04.essential-contract-extraction.md`
  - `-agent/-bootstrap/05.authority-model-audit.md`
  - `-agent/-bootstrap/07.cache-posture-pass.md`
  - `-agent/-bootstrap/08.consumer-truthfulness-pass.md`
  - `-agent/-bootstrap/09.hook-placement-factoring-pass.md`
  - `-agent/-bootstrap/10.upstream-overlap-pass.md`
  - `-agent/-bootstrap/11.proof-preserving-rewrite-pass.md`
  - `-agent/-bootstrap/12.final-shape-architecture-pass.md`
  - `-agent/-bootstrap/13.fixture-concern-ontology.md`
  - `-agent/-bootstrap/14.cross-pass-tmind-audit.md`

## Purpose
This plan turns the 14-note distillation line into an execution blueprint.

It is **not** another exploration note.
It is the task graph for replacing the current rescue-shaped bootstrap seam with the final architecture already distilled.

The plan exists to ensure implementation stays:
- STIER
- proof-preserving
- published-boundary-correct
- deterministic in direction
- narrow in ownership

---

## Stable doctrine
This entire plan is downstream of one doctrine:

**keep the early bootstrap seam, replace its rescue-shaped authority and delivery model with a ranked deterministic bridge, preserve the proven Vite 8 launch lane, and let fixtures prove the real consumer worlds that still matter.**

And in the shorter formulation from the architecture pass:

**project truth, deliver stably, launch narrowly, delegate early.**

If any implementation move stops serving those sentences, it is off-plan.

---

## Definition of done
This line is done when all of the following are true:

1. bootstrap remains a narrow early-startup seam only
2. authority projection is explicit and ranked
3. delivery is separated from projection
4. delivery identity is deterministic across equivalent runs
5. no visible bootstrap residue is written into consumer/package roots during normal operation
6. `Wrangle.command(...)` still owns the proven child launch contract
7. `--configLoader=native` remains intact for Vite 8+
8. upstream/runtime seams retake ownership immediately after startup
9. published JSR consumer worlds remain first-class proof targets
10. published-boundary Vite dev/build is materially better on the target line, not merely architecturally cleaner on paper
11. the focused proof line remains green throughout the rewrite

---

## Must not regress
These are non-negotiable.

### Runtime invariants
- Vite 8+ child commands stay on the earned compatible loader/runtime path
- bootstrap remains separate from app/plugin resolution
- dev/build transport separation stays untouched unless separately re-proven
- published/package-boundary truth must improve, not be masked

### Rewrite invariants
- no clean-room rewrite from panic
- no “brand new legacy” via cosmetic architecture cleanup ahead of proof
- no local-source alias workaround as the final answer for published-package consumption
- no symlink or mirrored-package endpoint disguised as architecture

### Proof invariants
- focused proof commands stay runnable throughout
- new risky behavior changes only happen after the missing proof worlds for that risk exist

---

## Execution posture
This plan must be executed in a strict cadence.

### Upstream source posture
Do **not** do broad Vite source reading before implementation movement.
If later phases require narrow upstream confirmation about ownership, startup handoff, or runtime-additions justification, use the local Vite source clone at:

- `/Users/phil/code/-random/vite`

Read only the smallest relevant seam needed for the concrete question at hand.

### Per phase
1. state the phase goal
2. make the minimum edit set for that phase
3. run the required proof gate for that phase
4. do a first TMIND check:
   - did the phase actually move the architecture toward the final shape?
5. do a second TMIND check:
   - did the phase accidentally broaden ownership or blur truth/delivery again?
6. only then do the BMIND review:
   - is the phase still preserving the earned Vite 8 line and the published-boundary target?
7. only then move to the next phase

That cadence is mandatory.

---

## Target architecture to land
The implementation target is:

### `Bootstrap.Project`
- explicit startup authority discovery
- ranked authority projection
- no delivery mechanics in the model

### `Bootstrap.Deliver`
- child-consumable handle only
- stable identity strategy
- cleanup only as low-level delivery detail if still needed

### `Wrangle.command`
- child launch contract only
- takes a bootstrap handle, not bootstrap internals

### narrow interop helpers
- package/runtime facts only where justified
- clearly secondary to authority truth

### separate workspace projection seam
- `m.vite.config.workspace` remains separate

### upstream/runtime handoff
- Vite native config loader owns config execution
- `@deno/vite-plugin` / upstream loader seams own in-pipeline Deno resolution

---

## File-shape landing target
The exact filenames may vary, but the plan assumes a landing shape roughly like this:

### Phase-1 tactical seam names
For the first implementation packet, keep the current tactical naming:
- `src/m.vite/u.bootstrap.ts`
- `src/m.vite/u.bootstrap.project.ts`
- `src/m.vite/u.bootstrap.deliver.ts`
- `src/m.vite/u.bootstrap.t.ts`

That keeps the first move behavior-preserving and avoids mixing conceptual graduation with the initial split.

### Final conceptual home
If the seam lands as intended, its truthful long-term home is better understood as:
- `src/m.vite.startup/`

That name is preferred over `bootstrap`, `imports`, or `esm`, because the final seam is not a general resolver or module-format subsystem.
It is a **startup authority projection + delivery + early handoff** seam.

### likely new/reshaped internal files
- `src/m.vite/u.bootstrap.ts`
  - thin coordinator/export surface only in Phase 1
- `src/m.vite/u.bootstrap.project.ts`
  - startup authority discovery + projection
- `src/m.vite/u.bootstrap.deliver.ts`
  - delivery handle generation + stable identity logic
- `src/m.vite/u.bootstrap.t.ts`
  - internal bootstrap model / handle types
- future graduation target:
  - `src/m.vite.startup/`
- `src/m.vite/u.interop.ts` or equivalent narrow helper
  - package/runtime interop facts currently smeared across bootstrap/wrangle

### files that should remain conceptually stable
- `src/m.vite/u.wrangle.ts`
- `src/m.vite/u.build.ts`
- `src/m.vite/u.dev.ts`
- `src/m.vite.config.workspace/*`
- `src/m.vite.transport/*`

This is a role target, not a filename fetish.

---

## Proof baseline before touching behavior
Before meaningful rewrite work, confirm the current baseline still stands.
Run from:

```bash
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite
```

### Baseline proof set
```bash
deno task test --trace-leaks ./src/m.vite/-test/-wrangle.test.ts ./src/m.vite/-test/-build.test.ts ./src/m.vite/-test/-dev.test.ts
deno task test --trace-leaks ./src/m.vite.transport/-test/-u.load.test.ts ./src/m.vite.transport/-test/-u.resolve.test.ts
deno task test --trace-leaks ./src/m.vite/-test/-build.transitive-jsr.test.ts ./src/m.vite/-test/-build.workspace-composition.test.ts ./src/m.vite/-test/-bridge.integration.test.ts
```

### Published-boundary companion baseline
```bash
deno task test --trace-leaks ./src/m.vite/-test.external/mod.ts
```

### Temporary local posture during the refactor campaign
The external/published-boundary lane remains a serious proof target and is **not** being retired.
However, if that lane is locally red because it is executing the currently published package rather than the local working tree, it may be classified separately from the local Phase 1 factoring move.

That means:
- do not treat the external published lane as nonsense
- do not silently delete its proof role
- do allow temporary local skipping/classification where needed so the behavior-preserving local refactor can proceed cleanly
- re-enable and revalidate the full external published lane after the local refactor move is clean and complete

### Why this exact baseline
It covers:
- wrangle launch contract
- build/dev runtime path
- transport separation
- transitive published-boundary behavior
- workspace composition
- bridge integration
- external/published consumer smoke

That is the minimum serious baseline.

---

# Task graph

## Phase 0 — Freeze the baseline
### Goal
Freeze the earned proof lane before architecture movement.

### Tasks
1. run the baseline proof set above
2. if anything is red, classify it before touching architecture
3. do not start the rewrite with a dirty proof state

### Outputs
- known-green baseline
- no architecture changes yet

### Gate
- all baseline proof commands green

### TMIND 1
- are we starting from proof rather than from theory?

### TMIND 2
- are we resisting the urge to “fix” unrelated noise first?

### BMIND review
- no architecture movement until the earned line is visibly stable

---

## Phase 1 — Separate projection from delivery without changing behavior
### Goal
Create the real internal boundary that the final architecture requires, while preserving exact runtime behavior.

### Tasks
1. introduce internal bootstrap types
   - startup authority model
   - delivery handle model
2. extract the current authority-discovery/projection logic into `Bootstrap.Project`
3. extract the current artifact-generation/cleanup logic into `Bootstrap.Deliver`
4. keep outward behavior identical for now:
   - current random artifacts may remain temporarily
   - current child handle shape may remain temporarily
5. make `u.bootstrap.ts` a thin coordinator over project + deliver

### Important rule
This phase must **not** change:
- merge policy
- payload breadth
- artifact identity
- wrangle launch semantics

### Outputs
- explicit `project` vs `deliver` boundary
- behavior-preserving internal split

### Files likely touched
- `src/m.vite/u.bootstrap.ts`
- `src/m.vite/u.bootstrap.project.ts`
- `src/m.vite/u.bootstrap.deliver.ts`
- `src/m.vite/u.bootstrap.t.ts`
- tests only if needed for import surface changes

### Gate
Run:
```bash
deno task test --trace-leaks ./src/m.vite/-test/-wrangle.test.ts ./src/m.vite/-test/-build.test.ts ./src/m.vite/-test/-dev.test.ts ./src/m.vite/-test/-bridge.integration.test.ts
```

### TMIND 1
- did the code now clearly distinguish truth modeling from delivery mechanics?

### TMIND 2
- did we accidentally smuggle a behavior change into a factoring phase?

### BMIND review
- if the phase changed more than internal boundaries, it failed

---

## Phase 2 — Separate interop facts from authority truth
### Goal
Move package/runtime interop logic out of bootstrap truth modeling so later authority cleanup can happen without npm/Vite contamination.

### Tasks
1. identify bootstrap logic that is really interop-only
   - package-anchor probing
   - plugin-react conditional detection
   - any package/runtime fact gathering used only for startup interop
2. move those concerns behind a narrow interop helper
3. keep the helper clearly secondary in the data flow
4. make `Bootstrap.Project` consume interop facts, not discover them ad hoc

### Important rule
This phase must **not yet** change whether interop facts are used.
It only changes where they live and how explicit they are.

### Outputs
- clearer distinction between:
  - primary truth
  - derived truth
  - interop-only facts

### Files likely touched
- `src/m.vite/u.bootstrap.project.ts`
- `src/m.vite/u.wrangle.ts`
- new `src/m.vite/u.interop.ts` or equivalent

### Gate
Run:
```bash
deno task test --trace-leaks ./src/m.vite/-test/-wrangle.test.ts ./src/m.vite/-test/-bridge.integration.test.ts ./src/m.vite/-test/-build.transitive-jsr.test.ts
```

### TMIND 1
- are interop facts now visibly secondary rather than blended into truth?

### TMIND 2
- did we preserve the current effective startup behavior while moving the concern boundary?

### BMIND review
- if bootstrap truth still depends on ambient package metadata in an opaque way, the phase is incomplete

---

## Phase 3 — Make the wrangle launch contract explicit
### Goal
Sharpen `Wrangle.command(...)` as the stable child-launch seam so later delivery changes do not keep re-litigating launch behavior.

### Tasks
1. make the input contract from bootstrap to wrangle explicit
2. keep wrangle responsible for:
   - command args
   - permissions
   - env
   - config-loader mode
   - optional bootstrap handle
3. keep wrangle free of projection internals
4. make disposal composition explicit and minimal

### Important rule
This phase must **not** revisit permissions or config-loader behavior except to make the boundary clearer.

### Outputs
- explicit launch contract
- bootstrap internals can evolve under wrangle without changing wrangle’s role

### Gate
Run:
```bash
deno task test --trace-leaks ./src/m.vite/-test/-wrangle.test.ts ./src/m.vite/-test/-dev.test.ts ./src/m.vite/-test/-build.test.ts
```

### TMIND 1
- is wrangle now clearly the launch seam and nothing more?

### TMIND 2
- did we avoid turning wrangle into a second bootstrap logic center?

### BMIND review
- if wrangle still knows too much about projection internals, the phase is incomplete

---

## Phase 4 — Add the missing proof worlds before risky redesign
### Goal
Create the proof worlds required for the actually risky changes.

### This phase is mandatory
Do **not** change deterministic identity, payload breadth, or merge policy before these proofs exist.

### New proof-world families to add

#### A. Deterministic identity worlds
Prove:
- equivalent startup authority yields equivalent delivery identity
- equivalent command identity does not churn casually

#### B. No-visible-residue worlds
Prove:
- normal operation does not leak visible bootstrap debris into consumer/package roots

#### C. Ranked-authority conflict worlds
Prove:
- explicit nearest vs root authority outcomes
- no accidental broad carry-over is required for green startup

#### D. Published consumer with minimal local crutches
Prove:
- published-boundary truth with reduced local fixture privilege
- boundary honesty remains intact

#### E. Startup handoff worlds
Prove:
- bootstrap owns startup only
- upstream/runtime seams own later phases

#### F. Published-boundary performance worlds
Prove:
- the target published JSR consumer lane is materially better in the places this refactor is supposed to improve
- second-run / warm-run posture is not accidentally left cold by unstable delivery identity

### Likely test surfaces
- new tests under `src/m.vite/-test/*`
- external or generated scenarios under `src/m.vite/-test.external/*`
- possibly new fixture helpers derived from the fixture ontology
- maybe one or two new proof builders rather than more giant sample folders

### Gate
New proof worlds exist and are green alongside the baseline.

### TMIND 1
- did we add proof worlds for the actual architecture risks rather than just more sample trees?

### TMIND 2
- are the new fixtures concern-first, not accidental-folder-first?

### BMIND review
- if the risky redesign still lacks direct proof worlds, do not proceed

---

## Phase 5 — Replace unstable delivery identity
### Goal
Remove random delivery identity and consumer-root leakage.

### Tasks
1. design the preferred delivery endpoint:
   - first ask whether no artifact is possible
2. if no-artifact is not yet proven, implement the fallback endpoint:
   - deterministic or content-addressed delivery
   - driver-owned/private location
   - stable across equivalent runs
3. remove random UUID artifact naming
4. stop using consumer/package roots as the visible artifact surface
5. keep cleanup, if still required, strictly subordinate to delivery

### Important rule
Do not broaden authority logic while changing delivery identity.
This phase is delivery-only.

### Outputs
- stable or derivable delivery identity
- no visible root leakage
- command identity stabilizes accordingly

### Gate
Run:
```bash
deno task test --trace-leaks ./src/m.vite/-test/-wrangle.test.ts ./src/m.vite/-test/-build.test.ts ./src/m.vite/-test/-dev.test.ts ./src/m.vite/-test/-bridge.integration.test.ts ./src/m.vite/-test/-build.transitive-jsr.test.ts
```
Plus the new deterministic/no-residue proof worlds from Phase 4.

### TMIND 1
- did equivalent semantic inputs now gain stable operational identity?

### TMIND 2
- is delivery now clearly transport only, not the model itself?

### BMIND review
- if delivery still defines the conceptual seam, the phase failed even if tests are green

---

## Phase 6 — Narrow the emitted payload to the essential contract
### Goal
Stop carrying broad bootstrap document residue.

### Tasks
1. remove whole-document JSON carry-through unless a proof world explicitly requires a surviving field
2. emit only the startup-relevant authority shape actually required by the child contract
3. keep runtime additions explicit and visibly subordinate
4. ensure delivery consumes a minimal projected model rather than a copied config document

### Important rule
This phase must narrow the projection, not change the launch seam.

### Outputs
- minimal payload
- no broad config document preservation by default

### Gate
Run:
```bash
deno task test --trace-leaks ./src/m.vite/-test/-build.test.ts ./src/m.vite/-test/-dev.test.ts ./src/m.vite/-test/-build.transitive-jsr.test.ts ./src/m.vite/-test/-build.workspace-composition.test.ts
```
Plus any new authority-conflict proof worlds.

### TMIND 1
- did we project startup truth instead of preserve a broad document shape?

### TMIND 2
- is the child still getting exactly what it needs and no more?

### BMIND review
- if payload narrowing breaks because hidden broad carry-over was doing real work, stop and reclassify that requirement explicitly

---

## Phase 7 — Replace flat merge with explicit authority ranking
### Goal
Make the authority model truthful, not merely broad enough to work.

### Tasks
1. replace broad root + nearest merge-first logic with explicit ranking
2. keep consumer truth primary
3. keep derived workspace truth only where actually inherited/required
4. keep driver-owned runtime additions explicit and separate
5. keep interop clearly secondary

### Important rule
This is the highest truthfulness-risk phase.
Do not mix it with new delivery experiments.

### Outputs
- explicit ranked authority model
- truth-shaped bootstrap projection

### Gate
Run:
```bash
deno task test --trace-leaks ./src/m.vite/-test/-bridge.integration.test.ts ./src/m.vite/-test/-build.workspace-composition.test.ts ./src/m.vite/-test/-build.transitive-jsr.test.ts
```
Plus the new ranked-authority conflict proof worlds and published-boundary proof worlds.

### TMIND 1
- can a reader now see consumer truth distinctly from workspace derivation and runtime additions?

### TMIND 2
- did we remove broad carry-over without lying about published-boundary reality?

### BMIND review
- if the model still feels like a synthetic merge world, the phase is incomplete

---

## Phase 8 — Re-evaluate bootstrap runtime dependency projection
### Goal
Reduce blocker-history closure lists to the minimum justified startup additions.

### Tasks
1. classify current hard-coded bootstrap dependency entries into:
   - still essential
   - delegable after startup
   - accidental carry-over
2. remove anything not actually required by the startup contract
3. keep whatever remains visibly in the driver-owned startup-additions class

### Important rule
Do not reduce lists by taste.
Reduce them only under proof.

### Outputs
- smaller, clearer runtime startup additions
- less blocker-history residue

### Gate
Run:
```bash
deno task test --trace-leaks ./src/m.vite/-test/-wrangle.test.ts ./src/m.vite/-test/-build.test.ts ./src/m.vite/-test/-dev.test.ts ./src/m.vite/-test/-build.transitive-jsr.test.ts
```

### TMIND 1
- is each remaining startup addition explicitly justified by the early bridge contract?

### TMIND 2
- did we avoid turning an upstream-owned runtime concern into local bootstrap debt again?

### BMIND review
- if a list entry remains only because “it used to be there,” it failed review

---

## Phase 9 — Final coordinator simplification
### Goal
Land the thin final coordinator shape.

### Tasks
1. make `u.bootstrap.ts` a small bridge coordinator over:
   - project
   - deliver
2. leave wrangle as the narrow launch seam
3. leave workspace projection separate
4. leave interop helper secondary and explicit
5. remove any leftover rescue-shaped public or conceptual surfaces

### Outputs
- final conceptual shape visible in the file system
- no mixed projection+delivery+interop+cleanup center remains

### Gate
Run the full serious line:
```bash
deno task test --trace-leaks ./src/m.vite/-test/-wrangle.test.ts ./src/m.vite/-test/-build.test.ts ./src/m.vite/-test/-dev.test.ts ./src/m.vite/-test/-bridge.integration.test.ts ./src/m.vite/-test/-build.transitive-jsr.test.ts ./src/m.vite/-test/-build.workspace-composition.test.ts
deno task test --trace-leaks ./src/m.vite.transport/-test/-u.load.test.ts ./src/m.vite.transport/-test/-u.resolve.test.ts
deno task test --trace-leaks ./src/m.vite/-test.external/mod.ts
```
Add any new Phase 4 proof-world tests as part of the same final gate.

### TMIND 1
- does the package now visibly embody the final doctrine: project, deliver, launch, delegate?

### TMIND 2
- would a future reader now understand the seam without inheriting rescue panic from the old line?

### BMIND review
- if the architecture is still explained by artifacts rather than by truth and boundaries, it is not done

---

# Dependency graph

## Core dependency order
```text
Phase 0  -> Phase 1 -> Phase 2 -> Phase 3 -> Phase 4 -> Phase 5 -> Phase 6 -> Phase 7 -> Phase 8 -> Phase 9
```

## Why this order is strict
- Phase 1 must happen before risky redesign because projection/delivery separation is the architecture hinge
- Phase 4 must happen before Phases 5–8 because those are the risky redesign phases
- Phase 5 must precede full cache/determinism claims
- Phase 6 must precede final truth-shape confidence because broad carry-over masks real contract size
- Phase 7 must happen after the missing authority proof worlds exist

---

## What should not be done in parallel
Do **not** overlap these categories in one move:

- delivery identity redesign
- payload narrowing
- authority ranking changes
- transport changes
- unrelated dependency cleanup
- workspace alias/projection redesign

The phase order exists to prevent proof ambiguity.

---

## Explicit stop conditions
Stop immediately and reclassify if any phase causes:

1. pressure to touch transport to make bootstrap changes work
2. pressure to broaden wrangle ownership to compensate for a bootstrap failure
3. pressure to restore broad merge behavior without naming the exact proof world that needs it
4. pressure to keep random artifacts “for now” after the deterministic delivery proof worlds already exist
5. pressure to solve published-boundary breakage with local-only crutches

These are signs the rewrite is drifting off-architecture.

---

## Final success review
When the plan is complete, the resulting line should let a reader say:

1. I can see consumer truth distinctly from runtime additions.
2. I can see delivery separately from truth.
3. I can see wrangle is only the launch seam.
4. I can see where upstream takes over.
5. I can see why equivalent runs stay operationally equivalent.
6. I do not see visible bootstrap residue in consumer/package roots.
7. I can see that published JSR consumer reality remained the real target boundary.
8. I can see that the line got materially better where the published-boundary consumer actually pays the cost.
9. I can see that the fixtures still prove the important worlds rather than merely preserve old sample folders.

If those are all true, the plan succeeded.

---

## Triple-check sequence

### First TMIND check
- This plan is implementation-shaped, not merely architectural commentary.
- Every phase is tied to a concrete goal, gate, and doctrine check.

### Second TMIND check
- The plan preserves the earned Vite 8 line while still moving aggressively toward the final architecture.
- It does not confuse “remove residue” with “rewrite everything at once.”

### Third TMIND check
- The task graph respects the actual risk topology:
  - isolate first
  - add missing proof worlds
  - redesign risky areas one band at a time
- That makes the plan operationally trustworthy.

## Final BMIND review
This is the real/correct engineering assessment for the implementation blueprint:
- the architecture is already sufficiently distilled; the main remaining challenge is execution discipline
- the decisive move is to split projection from delivery without changing behavior, then add the missing proof worlds before touching deterministic identity, payload breadth, or authority ranking
- if this plan is followed strictly, the rewrite should converge on the final bootstrap bridge architecture without reopening the original Vite 8 frontier
- this file should therefore be treated as the canonical execution map for the bootstrap replacement effort
