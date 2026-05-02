# Pass-through extraction plan

## Status

Historical design note. The internal seam now exists under `src/u.passThrough/` and is used by thin
pass-through wrappers such as `@sys/tools pi` and `@sys/tools tmpl`.

## Purpose

Extract the shared local-vs-published delegation decision out of thin `@sys/tools/*` pass-through
wrappers without prematurely abstracting wrapper-specific command assembly.

Initial sample callers:

- `src/cli.pi/mod.ts`
- `src/cli.tmpl/mod.ts`

## Core split

The extracted shared seam should own:

- workspace probe
- repo-shape proof
- local vs published delegation choice
- root-testable delegation context

The wrapper-specific files should continue to own:

- cwd default behavior
- env injection
- command tail assembly
- subcommand injection
- exit-code behavior

Do not abstract `Process.inherit(...)` shapes too early.

## Current internal type root

The initial type contract now lives at:

- `src/u.passThrough/t.ts`

This type layer is intentionally small and structural. It is the proof root for the extraction, not
the final consumer refactor.

## Root-testable output

The future shared context resolver should produce one canonical object shape:

- `PassThroughContext`

That context should answer only:

- what cwd is being evaluated
- whether delegation resolved to `local` or `published`
- why that decision happened
- which specifier was selected
- what target contract was used
- optional workspace provenance for debugging/tests

## Alias / root-menu indexing rule

This plan must support one canonical root command plus optional aliases `0..n`.

However, aliases do **not** belong in the pass-through delegation context. They belong in the root
registry / dispatcher layer.

Meaning:

- the pass-through seam resolves execution context once a root tool has already been selected
- the root layer owns the index from:
  - canonical command name
  - zero or more aliases
  - to the same root tool registration

Therefore:

- pass-through context stays execution-oriented
- alias/index metadata stays menu/dispatch-oriented

This is an explicit design constraint, not an implementation detail.

## Example family shape

Thin wrappers may differ in command policy while sharing one context resolver.

Examples:

- `@sys/tools pi` → delegates to `@sys/driver-pi/cli` with injected `Profiles` and help env
- `@sys/tools tmpl` → delegates to `@sys/tmpl` with direct argv pass-through
- future `@sys/tools <foo>` → may delegate to `@sys/<foo>` with its own command tail

Shared:

- local-vs-published context decision

Per-wrapper:

- command/env assembly

## Incremental sequence

1. Keep `src/u.passThrough/t.ts` as the internal proof root.
2. Add a shared context resolver, likely under `src/u.passThrough/`.
3. Add one root test for the context resolver:
   - `system-workspace` → local
   - `no-workspace` → published
   - `workspace-mismatch` → published
4. Refactor one live caller first:
   - `src/cli.pi/mod.ts`
5. Only after that stabilizes, refactor:
   - `src/cli.tmpl/mod.ts`
6. Later, if justified, connect the same doctrine into root registry/menu indexing work.

## Explicitly out for the first pass

- no generic launcher framework
- no shared `Process.inherit(...)` planner yet
- no root menu alias implementation mixed into the first context extraction
- no multi-caller refactor in one step
- no public export commitment yet

## Acceptance for the first extraction

A first extraction is good enough when:

- one shared context resolver exists
- one root behavior test proves the local/published choice cleanly
- `cli.pi` adopts it without changing wrapper-specific command policy
- alias/index concerns remain clearly documented as root-layer ownership, not leaked into
  pass-through context
