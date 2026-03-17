# Deno Deploy Design Thesis

## Purpose

This module exists to make Deno Deploy boring.

The goal is not to "use platform features well". The goal is to own a stable
deploy primitive with truthful boundaries, so that deployment stops being a
confidence-shaking event and becomes a repeatable part of the system.

## The Workspace Contract

The deploy contract is rooted in the repo shape we actually own:

1. A deployable app lives inside a multi-module workspace generated from
   `@sys/tmpl/repo`.
2. Deploy targets are paths declared in the root `deno.json` `workspace`
   array.
3. `./code/projects/*` is the default repo/pkg starting shape, not the deploy
   contract itself.
4. The staged workspace is shipped as a whole. The selected workspace child
   keeps its normal environment assumptions, and execution is routed down into
   that target.
5. At runtime, the app is served by a dynamic HTTP server.
6. That server may handle dynamic routes and may also serve built frontend
   assets from the target `dist/`.
7. Future pruning of unused workspace material is an optimization, not part of
   the correctness contract.

This is the shape to preserve. Implementation details are allowed to change.
This contract is not.

## What Is Now Proven

We know several important things with high confidence:

1. Deno Deploy will run the package.
2. Deno Deploy will run our dynamic HTTP server.
3. A prebuilt `dist/` staged under the selected workspace child survives deploy
   and is readable at runtime.
4. The dynamic server can serve `index.html` and emitted JS assets from that
   staged `dist/`.
5. The staging side of the API is clean, strong, and stands on its own.
6. The deploy core can remain small if we keep the contract explicit.

This means the platform already gives us enough.

We do not need exotic helper features. We do not need platform magic. We do
not need to surrender ownership of the artifact shape.

## The Platform Seam We Discovered

The major seam we uncovered was real:

- remote build output for a dynamic app was not available at runtime in the
  ordinary filesystem way we initially expected
- that was not confusion on our side; it was a platform contract boundary that
  is easy to assume incorrectly

This discovery matters because it changes how we should design the deploy path.

The wrong conclusion would be:

- "dynamic deploy is broken"

The right conclusion is:

- dynamic deploy is sufficient
- remote build artifact visibility is not a contract we should build our system
  around
- prebuilt artifacts staged into the selected workspace child are the reliable
  contract to build around

## The Operating Principle

Beyond the basic runtime envelope, everything should remain ours.

Deno Deploy gives us:

- a Deno runtime
- an entry execution surface
- dependency resolution and environment setup

That is enough.

Everything beyond that should stay inside our contract:

- workspace truth
- build artifacts
- routing shape
- app entry discipline
- frontend asset ownership

Remote computers we do not control must not become core workflow dependencies.
They should be aggressively ring-fenced and treated as narrow runtime walls, not
as places where essential application truth is assembled.

## Design Stance

The deploy stance from here is conservative:

1. Pre-build what matters.
2. Stage what matters.
3. Deploy into a minimal dynamic runtime contract.
4. Serve exactly what we own.
5. Avoid leaning on platform helper features as foundational assumptions.

This is no longer hypothetical. The prebuilt `dist/` path has now been proven
live on Deno Deploy under a dynamic server.

In practical terms:

- "build" on Deno Deploy should be treated as pedestrian environment prep at
  most
- not as a magical assembly step we depend on for correctness

If the platform offers convenience, we may use it.
If the platform changes the ownership boundary, we should not depend on it.

## Current Assessment

### Staging

The staging side is very clean.

It is principled, truth-preserving, and close to the level that should stand up
to strong external scrutiny.

### Deploy

The deploy side has been pared back to a sensible baseline and the core
prebuilt-asset assumption is now de-risked.

The tactical hacks from the discovery/debugging loop can and should be treated
as temporary seam work, not architecture. What remains now is to tighten the
entry contract and artifact contract so the deploy path becomes just as boring
as staging.

## Next Move

The next step is not more platform probing.

The next step is to tighten the deploy contract:

1. define one canonical deploy entry contract
2. route runtime through that one contract only
3. remove scattered target-path reconstruction
4. remove temporary debug surfaces
5. polish the deploy API around the now-proven prebuilt `dist/` model

This is contract design work now, not rescue work.

## Future Note

Deploy log access should be pulled under the same owned contract.

Rather than depending directly on `deno deploy logs`, we should add a proper
API-backed log path that:

- uses the existing deploy token/org/app information from the external deploy
  env surface
- keeps log access structured and scriptable
- avoids accidental config pollution or interactive re-auth flows from ad hoc
  CLI usage

Until that exists, any native deploy CLI usage should go through one owned
helper surface with explicit `cwd` and explicit `--config`. Direct package-root
`deno deploy*` usage should be treated as unsafe.

This is a future deploy-operations task, not part of the core runtime entry
contract.

## End State

The desired outcome is simple:

- deployment is stable
- deployment is unsurprising
- deployment does not shake confidence
- working within the declared workspace/app expectations is enough
- the system "just works" because the contract is narrow, owned, and truthful

That is the bar.
