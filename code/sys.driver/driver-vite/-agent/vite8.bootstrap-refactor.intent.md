# Intent — `m.vite/u.bootstrap.ts` refactor

## Scope
- Package: `code/sys.driver/driver-vite`
- Module frontier: `src/m.vite/u.bootstrap.ts`
- Adjacent truth sources:
  - `src/m.vite.config.workspace/`
  - `npm:@deno/vite-plugin@2.0.2`

## Distilled situation
The current Vite 8 line is working and proven, but the bootstrap seam still feels like earned rescue architecture rather than final architecture.

We are **not** reopening the earlier Vite 8 compatibility proof from scratch.
We are taking the currently working line as the baseline and asking:

> now that we know what working looks like, what is the proper top-down shape for the bootstrap seam?

## Why this module exists
`u.bootstrap.ts` exists because post-Vite 8 the child Vite CLI no longer carries the consumer's Deno import authority into config/bootstrap runtime automatically, so `driver-vite` reconstructs enough authority for the child to start under Deno.

## Important grounding
### 1. This is still the `driver-vite` package
The active design surface is:
- `code/sys.driver/driver-vite`

This is a **driver/integration** problem, not just an app-config problem.

### 2. `@deno/vite-plugin` does not solve the decisive seam
`npm:@deno/vite-plugin@2.0.2` is useful, but it explicitly does **not** solve Deno resolution for `vite.config.ts` / config bootstrap.
That is why custom bootstrap/runtime work was required here.

### 3. `m.vite.config.workspace` represents a cleaner shape
`src/m.vite.config.workspace/` is a useful model because it is:
- deterministic
- narrow
- based on declared workspace/package export truth
- easier to reason about than the current synthetic bootstrap authority merge

This suggests the refactor direction should be:
- preserve earned compatibility behavior
- move toward narrower, more explicit, more truthful authority modeling
- avoid letting emergency bootstrap fabrication become permanent legacy shape

## Current best read
The current `u.bootstrap.ts` solved a real Vite 8 breakage during the upgrade probe line, but it now carries three major liabilities:

1. **determinism risk**
   - random temp bootstrap file names
   - unstable file URL identity
   - likely poorer cache reuse

2. **authority breadth risk**
   - merged root + nearest import authority
   - carried-through import-map JSON shape broader than the child may truly need

3. **consumer-truth drift risk**
   - synthetic authority world may diverge from the actual consumer/runtime truth
   - especially around published/package-boundary behavior

## Statement of intent
This work is **not** a cleanliness pass over the current bootstrap shape.
It is a top-down replacement effort.

The current task is:
- distill the exact working bootstrap shape from the proven Vite 8 line
- identify the real and correct factoring and integration hooks into Vite that this shape implies
- replace the current rescue-shaped seam with the stripped-down essential baseline that is both principled and proven

We no longer need to discover what works.
We already have the working line.
The job now is to reshape that working line into its minimal correct form.

This replacement is intended to redesign `m.vite/u.bootstrap.ts` so that the Vite 8 child bootstrap seam becomes:

- **more deterministic**
- **narrower**
- **more consumer-truthful**
- **more cache-stable**
- **faster for Vite consumers importing the published JSR form of `@sys/*` modules in Vite dev and build**
- while preserving the already-proven Vite 8 runtime/build behavior

## Non-goals
This refactor is **not** trying to:
- delete bootstrap authority entirely without proof
- replace the earned Vite 8 line with speculative cleanliness
- paper over the issue with symlinks or fake local package hacks
- treat `@deno/vite-plugin` as a drop-in answer for config/bootstrap, because it is not

## Working design question
The right question is no longer:
- “how do we keep patching the bootstrap seam?”

The right question is:
- “what is the minimum truthful authority contract the Vite 8 child actually needs, and how do we provide it deterministically?”

## First refactor targets
If this line is resumed, the first design checks should be:

1. can bootstrap artifact identity become deterministic?
   - avoid random UUID file names when possible
   - prefer stable paths or stable content-addressed paths

2. can bootstrap payload become narrower?
   - emit only the authority the child truly needs
   - avoid carrying broad merged import-map JSON if unnecessary

3. can bootstrap truth move upward?
   - prefer explicit authority projection over synthetic environment reconstruction
   - borrow shape lessons from `m.vite.config.workspace`

## Definition of done
This line is done when all of the following are true:

- no random `.vite.bootstrap.*` authority files are written into consumer/package roots during normal operation
- bootstrap identity is deterministic across equivalent runs
- bootstrap authority is reduced to the minimum child-runtime contract actually required by the proven Vite 8 line
- the resulting seam is explicit and understandable as a legitimate integration layer rather than a rescue workaround
- Vite consumers importing the published JSR form of `@sys/*` modules are materially faster and stable in both dev and build
- the already-proven Vite 8 child runtime/build behavior remains intact
- the focused `driver-vite` proof line remains green

## Must not regress
The refactor must not regress these established truths:

- Vite 8+ child commands use the earned compatible loader/runtime path
- bootstrap authority remains separate from app/plugin resolution concerns unless a replacement seam is equally proven
- dev and build transport behavior remain intentionally distinct where required
- published/package-boundary behavior is improved by principled integration, not hidden by local-only hacks
- the final shape must be cleaner because it is more correct, not merely because it is smaller

## Rejected endpoints
The following do **not** count as success:

- a local-source alias workaround treated as the final answer for published-package consumption
- symlink-based or mirrored-package indirection
- a cosmetically smaller bootstrap layer that preserves the same unstable/random authority identity underneath
- a rewrite that loses the proven Vite 8 line and reopens the original frontier

## Merge posture
Treat this as a **distillation / rearchitecture note**, not a proof that the current line is wrong.
The current line is working.
The next step is to refactor from a position of proof rather than from panic.
