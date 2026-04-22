# PLAN — closeout packet for generated-workspace loader bootstrap

## Status
- phase posture:
  - post-`.08` closeout / ship verification
- lane:
  - generated-workspace bootstrap/install truth
- original failing proof world:
  - `src/m.vite/-test.external/-repo-generated.workspace.ts`
- current state:
  - resolved locally

## Purpose
This note is the narrow execution packet for the generated `tmpl.repo` bootstrap/install failure.

It exists so this lane can be worked with the same discipline as the earlier startup phases:
- smallest serious proof world first
- no guessed dependency patches
- no architecture drift
- no brute-force aggregate reruns until the owning layer is proven

## One-sentence operator summary
Trace and fix the generated-repo bootstrap/install path so template-generated external consumers can install and build truthfully, instead of being blocked by a transitive `@deno/loader` dependency world surfacing through `@deno/vite-plugin`.

---

## Why this lane matters
This is not vanity cleanup.
It is the first honest generated-consumer install world inside `/sys` after the main published-boundary startup line moved green.

If this lane is left fuzzy, later claims become weak:
- generated template consumers are not actually proven
- install/bootstrap truth remains mixed with local privilege
- later perf work lacks a stable outside-in baseline

If this lane is landed cleanly, `/sys` owns a serious automated proof world for:
- template-generated consumer install
- template-generated consumer build
- future external regression checks
- later speed/perf comparison from a truthful working baseline

---

## Current known truth
### Green / moved lanes
These are no longer the active frontier:
- published baseline build/dev correctness
- published `ui-components` build/dev correctness under narrowed proof
- published minimal-crutch build/dev correctness

### Original red lane
The red that motivated this packet was:
- `src/m.vite/-test.external/-repo-generated.workspace.ts`

Representative failure at the time:
```text
cmd: deno npm install --package-lock=false
npm error 404 Not Found - GET https://registry.npmjs.org/@jsr%2fdeno__loader - Not found
npm error 404  The requested resource '@jsr/deno__loader@^0.5.0' could not be found
```

### Current causal trace
Current evidence says the failing dependency is transitive, not directly declared in our generated template dependency authority.

Observed upstream declaration:
- `@deno/vite-plugin@2.0.2`
  - depends on `@deno/loader: "npm:@jsr/deno__loader@^0.5.0"`

Observed local confirmation:
- root `deno.lock` already records:
  - `@deno/loader@npm:@jsr/deno__loader@0.5.0`
  - tarball from `https://npm.jsr.io/.../@jsr/deno__loader/0.5.0.tgz`

So the red is not currently best explained by:
- a missing direct `jsr:@deno/loader` import in our root dependency specs
- startup seam truth
- published `driver-vite` bootstrap architecture

It is currently best explained as:
- a generated bootstrap/install world resolving a transitive npm-mirrored JSR package through the wrong registry/install path

---

## Strong intent
### What this move is
- isolate the owning layer of the generated-workspace bootstrap failure
- determine whether the failure belongs to:
  - generated bootstrap verb/mechanics
  - generated dependency surface generation
  - or external toolchain/install expectations
- fix only the layer that actually owns the red

### What this move is not
- not another startup architecture phase
- not a reason to re-open `.05`–`.08`
- not permission to add guessed direct deps just because the transitive dep name is visible
- not permission to weaken the proof world until it passes trivially

---

## Non-goals / false fixes
The following moves are forbidden unless later evidence explicitly earns them:

1. **Do not add `jsr:@deno/loader` to root or template `-deps.yaml` preemptively.**
   - That would patch the wrong layer before proving that direct dependency ownership is the issue.

2. **Do not hand-edit generated dependency artifacts to chase the failure.**
   - No direct patching of generated `imports.json` / generated `package.json` as a first response.

3. **Do not skip `-repo-generated.workspace.ts` just to recover full `test:external` green.**
   - Skip only if an explicit temporary classification decision is made in its own narrow commit.

4. **Do not rerun `deno task test:external` repeatedly while this single lane is already isolated.**
   - Use the narrow world until a concrete cause or fix candidate exists.

5. **Do not blur npm-install truth with import-map truth.**
   - This failure occurs before the generated repo build world even reaches runtime import-map behavior.

---

## Owning files for this packet
### Proof world
- `src/m.vite/-test.external/-repo-generated.workspace.ts`
- `src/m.vite/-test.external/u.fixture.tmpl.ts`

### Template authority surfaces
- `code/-tmpl/-templates/tmpl.repo/-deps.yaml`
- `code/-tmpl/-templates/tmpl.repo/imports.json`
- `code/-tmpl/src/m.tmpl/-bundle.json`

### Relevant upstream/transitive evidence
- `@deno/vite-plugin@2.0.2` package metadata
- root `deno.lock`

---

## BMIND framing
Before editing anything, hold the world freshly:

### The real question
Why does the generated external repo, when bootstrapped the way the proof world currently bootstraps it, attempt to fetch the npm-mirrored JSR package `@jsr/deno__loader` from `registry.npmjs.org` instead of resolving the correct mirror/install path?

### The ownership question
Which layer actually owns the correction?
- template dependency declaration?
- template bootstrap/install verb?
- external install environment assumptions?
- upstream toolchain dependency world?

### The discipline question
What is the smallest truthful change that makes this generated external consumer world install and build correctly without introducing fake local privilege or guessed dependency ballast?

---

## TMIND execution packet
Work in this exact order.
Do not jump to edits before the classification result is earned.

### Step 1 — reproduce only the narrow failing lane
Run only:
```bash
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite

deno task test --trace-leaks ./src/m.vite/-test.external/-repo-generated.workspace.ts
```

Goal:
- keep the failure local to one file
- preserve the exact failing bootstrap command and generated temp repo path

### Step 2 — inspect the generated repo dependency world
From the generated temp repo created by that run, inspect:
- `repo/-package.json`
- `repo/-deps.yaml`
- `repo/imports.json` if materialized
- `repo/package.json` if materialized
- any npm config / lock / install metadata produced before failure

Questions:
- is `@deno/vite-plugin` present directly? likely yes
- is `@deno/loader` present directly? likely no
- is `@jsr/deno__loader` present directly? likely no
- what exact install surface is `deno npm install` acting on?

### Step 3 — trace the bootstrap verb itself
Read the generated-world bootstrap path in:
- `src/m.vite/-test.external/u.fixture.tmpl.ts`

Current suspect:
- `runCommand(rootDir, 'npm', ['install', '--package-lock=false'])`
  - rendered in diagnostics as `deno npm install --package-lock=false`

Questions:
- is this the right bootstrap verb for a generated repo of this kind?
- is the proof world intentionally using `deno npm install` to materialize npm deps for Vite?
- does this verb bypass the mirror behavior that plain Deno runtime resolution already understands through lock/install state?

### Step 4 — trace the transitive owner, not just the failing package name
Confirm the chain from real package metadata:
- generated repo depends on `@deno/vite-plugin@2.0.2`
- `@deno/vite-plugin` depends on `@deno/loader: npm:@jsr/deno__loader@^0.5.0`

Goal:
- lock the causal chain before discussing fixes
- avoid treating `@jsr/deno__loader` as if it were our own direct dependency omission

### Step 5 — decide the owning layer using the matrix below
Only after steps 1–4, classify the fix:

#### Case A — template dependency authority is wrong
Signs:
- the generated repo is missing a dependency that should be explicitly owned by template dependency generation
- generated surfaces are inconsistent with the intended repo bootstrap model

Allowed fix:
- change `-deps.yaml`
- run official prep
- verify generated outputs

#### Case B — bootstrap verb/mechanics are wrong
Signs:
- dependency surfaces are correct
- but the generated proof world uses the wrong install/bootstrap command for this repo model
- changing the command/path fixes the install without adding fake deps

Allowed fix:
- narrow change in `u.fixture.tmpl.ts` or the owning generated bootstrap helper
- update proof and docs accordingly

#### Case C — external toolchain / upstream dependency-world behavior is the issue
Signs:
- generated surfaces are correct
- bootstrap verb is principled
- failure still comes from an upstream npm/JSR mirror resolution path outside our direct ownership

Allowed fix:
- classify explicitly
- choose the narrowest truthful workaround only if it does not falsify the proof world
- otherwise document and contain as a separate external blocker

### Step 6 — only then edit
Make the smallest change consistent with the classification.
No opportunistic cleanup.
No adjacent startup edits.
No broad template rewrite.

### Step 7 — verify only the narrow lane first
After any candidate fix, run only:
```bash
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite

deno task test --trace-leaks ./src/m.vite/-test.external/-repo-generated.workspace.ts
```

Only after that lane moves honestly should the broader aggregate be reconsidered.

---

## Decision tests
A proposed fix is **wrong** if any of these become true:
- we cannot explain why the fix belongs to the edited layer
- the fix adds a dependency we do not actually own directly
- the generated repo passes only because we reintroduced hidden local privilege
- the proof world no longer represents a serious generated external consumer
- we solved `@jsr/deno__loader` by bypassing the real install/bootstrap path instead of correcting it

A proposed fix is **likely right** if all of these become true:
- the generated repo still stages a truthful external template world
- the install/bootstrap path is explainable in one sentence
- the fix belongs clearly to template authority, bootstrap mechanics, or explicit external classification
- the narrow generated-workspace lane moves green without smearing the issue back into architecture

---

## Stop conditions
Stop and report before editing if any of these happen:
- the temp generated repo no longer contains enough evidence to classify the install path
- the bootstrap verb appears correct but the failing mirror behavior is clearly outside our ownership and has no truthful local fix
- the only passing option is to add a guessed direct dependency with no ownership proof
- the lane cannot be reproduced narrowly anymore

---

## Done condition for this packet
This packet is complete when one of the following is true:

1. **real local fix landed**
   - generated-workspace lane green
   - owning layer explained clearly

2. **truthful blocker classification landed**
   - lane remains red
   - but the blocker is now precise, separate, and documented at the correct layer

This packet completed via outcome 1.

### Resolved local truth
- owning layer:
  - bootstrap verb/mechanics
- decisive fix:
  - switch generated workspace bootstrap from raw npm install mechanics to the generated repo's canonical Deno install flow
- result:
  - generated-workspace lane green
  - aggregate external lane later reran green

The packet is **not** complete merely because the aggregate suite gets greener.

---

## Commit shape guidance
If this lane yields a real fix, prefer a commit message shaped like the actual owner, for example:
- `fix(driver-vite): correct generated workspace bootstrap for transitive loader resolution`
- `fix(tmpl): align generated repo bootstrap with Deno loader mirror resolution`

If this lane yields only classification, prefer a docs/test classification commit rather than a fake fix.

---

## Final TMIND check
- This packet works the smallest serious failing world.
- It does not guess the fix from the package name alone.
- It protects dependency authority from panic edits.
- It preserves the stronger current truth: generated external consumer install/build is now the next real acceptance boundary.

## Final BMIND review
The generated-workspace loader lane is worth this care.
It is the first place where `/sys` can prove that template-generated external consumers install and build truthfully without leaning on local workspace privilege.
That makes it both a correctness frontier and the right future baseline for any later performance work.
