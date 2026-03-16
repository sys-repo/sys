# Deno Entry Plan

## Purpose

This plan captures the next engineering pass after proving that a staged,
prebuilt target `dist/` can be served from a dynamic Deno Deploy runtime.

The platform question is answered.

The work now is to engineer the runtime entry seam cleanly:

- one canonical root entry
- one canonical injected fact
- one shared package entry contract used locally and in deploy
- no generated lore blobs

## Design Goal

The root staged runtime should stabilize around:

- `/entry.ts`
- `/entry.paths.ts`

The package-local runtime hook should stabilize around:

- `<targetDir>/src/entry.ts`

The root is a stable adapter.
The package entry is the real app/runtime seam.

## Core Decisions

### 1. Inject one fact only

`entry.paths.ts` should inject only:

```ts
export const targetDir = "./code/projects/foo";
```

Everything else is derivable:

- package entry: `${targetDir}/src/entry.ts`
- package metadata: `${targetDir}/src/pkg.ts`
- built assets: `${targetDir}/dist/`

This avoids storing path lore in the staging layer.

### 2. Root entry stays tiny

`/entry.ts` should be a stable adapter only.

Conceptually:

```ts
import { targetDir } from "./entry.paths.ts";
export default await DenoEntry.serve({ targetDir });
```

The exact spelling may vary, but the shape should stay small and explicit.

### 3. Package entry is the real runtime seam

If `<targetDir>/src/entry.ts` exists, root entry defers to it.

That package entry should export a standard runtime hook, for example:

```ts
export async function main(ctx: t.EntryContext): Promise<t.EntryResult> {}
```

This type surface belongs in `driver-deno`, not in app-local folklore.

### 4. Local and deploy must use the same seam

The package `src/entry.ts` must not be deploy-only.

It should be the same seam used by:

- local start flows
- local tests
- deploy runtime

If local DX does not exercise the same entry contract, the design is wrong.

### 5. Default fallback stays boring

If `<targetDir>/src/entry.ts` does not exist, the root adapter falls back to
serving `<targetDir>/dist/`.

That keeps the zero-magic default path:

- build first
- stage workspace
- serve built assets

## Module Placement

This shared runtime seam should live alongside `m.DenoDeploy`, not inside it.

Recommended module:

- `src/m.cloud/m.DenoEntry`

Why:

- it is not deploy mechanics
- it is a Deno app entry contract
- deploy uses it
- local runtime should also use it

This keeps `m.DenoDeploy` focused on:

- stage
- deploy invocation
- deploy config/env/result surfaces

## Planned Sequence

1. Stub `m.DenoEntry`.
   - `mod.ts`
   - `t.ts`
   - helper surface for `serve({ targetDir })`

2. Define the entry contract types.
   - `EntryContext`
   - `EntryResult`
   - decide the exact standard result shape

3. Reduce staged metadata to `targetDir` only.
   - update `u.createStageEntrypoint.ts`
   - update stage tests

4. Add the root adapter.
   - `DenoEntry.serve({ targetDir })`
   - derive package entry and dist paths internally

5. Support package override by convention.
   - detect `<targetDir>/src/entry.ts`
   - call exported `main(ctx)` when present

6. Keep default dist-serving fallback.
   - if no package entry exists, serve `<targetDir>/dist/`

7. Update local tests first.
   - metadata test now asserts only `targetDir`
   - local deploy/runtime tests prove:
     - fallback dist serving
     - package entry override

8. Update external proof second.
   - preserve the prebuilt-dist proof lane
   - keep proving real HTML and JS asset serving

9. Remove temporary debug scaffolding once replaced by clean observability.
   - `/-info.json`
   - incidental debug-only path output

## Quality Bar

This pass is done when:

- staged root injects only `targetDir`
- root `entry.ts` is tiny and stable
- package `src/entry.ts` is the same seam used locally and in deploy
- default dist-serving fallback still works
- external prebuilt-dist proof still passes
- no path-lore blob remains in generated entry files

## Naming Guidance

Use `entry`, not `main`, as the canonical noun for this seam:

- root staged adapter: `entry.ts`
- staged metadata: `entry.paths.ts`
- package runtime hook: `src/entry.ts`

This keeps the concept singular and visible.
