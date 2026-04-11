---
name: published-passthrough-couplings
description: Use when adding or reviewing a published passthrough whose pinned fallback specifier creates a real release edge that the normal workspace import graph cannot see.
---

# Published Passthrough Couplings

## When to use this skill

Use this skill when a published tool delegates to another workspace package through a pinned fallback specifier.

Typical shape:

- local monorepo runtime resolves to a workspace specifier
- published runtime falls back to `jsr:@scope/pkg@<version>/...`

Treat that relationship as a real release edge even when static imports do not show it.

## Rule of thumb

If bumping package `A` should force a published fallback string in package `B` to change, then `A -> B` is a published passthrough coupling.

That means the relationship must be declared for release tooling even if the normal workspace graph does not contain an import edge.

## Scope

Published passthrough couplings matter for:

- root bump planning
- published fallback pinning during prep

They are not visible in the normal workspace import graph, so they must be modeled explicitly.

## Source of truth

Declare passthrough couplings in:

- [`-scripts/u.passthrough.ts`](../../../-scripts/u.passthrough.ts)

That declaration is consumed by:

- [`-scripts/task.bump.ts`](../../../-scripts/task.bump.ts)
- [`code/sys.tools/-scripts/task.prep.ts`](../../../code/sys.tools/-scripts/task.prep.ts)

## Procedure

When adding a new published passthrough:

1. add one entry to [`-scripts/u.passthrough.ts`](../../../-scripts/u.passthrough.ts)
2. ensure prep pins the published fallback through that shared target
3. add or update bump closure tests in [`-scripts/-test/-task.bump.test.ts`](../../../-scripts/-test/-task.bump.test.ts)
4. add or update prep pinning tests in [`code/sys.tools/-scripts/-test/-prep.test.ts`](../../../code/sys.tools/-scripts/-test/-prep.test.ts)

The intended result is simple:

- bump sees the release edge
- prep rewrites the fallback specifier from the same declaration

## Non-goals

Do not:

- duplicate the same coupling in multiple ad hoc lists
- try to infer these edges from the normal package import graph
- treat these as broad canon rules outside release tooling

## Current examples

- `@sys/tools/tmpl` -> `@sys/tmpl`
- `@sys/tools/code` -> `@sys/driver-agent/pi/cli`

## Intent

Keep this skill small, explicit, and machine-locatable.

Its job is to keep release tooling honest when dynamic published delegation creates a real dependency that the static workspace graph cannot see.

If the relationship is real for prep and bump, declare it once and reuse it everywhere.
