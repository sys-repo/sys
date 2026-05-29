# Pkg namespace factoring S-tier plan

- [x] 465eb4f05 refactor(fs): namespace Pkg contract surface

## Purpose

Bring `code/sys/fs/src/m.Pkg` to the modern @sys namespace grammar without changing the public runtime surface.

Runtime values stay stable:

```ts
Pkg.*
Pkg.Dist.*
Pkg.Dist.Log.*
Dist.*
```

Target type surface becomes namespace-first:

```ts
t.Pkg.Lib
t.Pkg.Dist.Lib
t.Pkg.Dist.Log.Lib
t.Pkg.Dist.Log.Options
t.Pkg.Dist.Compute.Method
t.Pkg.Dist.Compute.Args
t.Pkg.Dist.Compute.Response
t.Pkg.Dist.Load.Method
t.Pkg.Dist.Load.Kind
t.Pkg.Dist.Load.Response
t.Pkg.Dist.Verify.Method
t.Pkg.Dist.Verify.Response
```

## Scope

Primary target:

- `code/sys/fs/src/m.Pkg/t.ts`

Required adjacent updates:

- `code/sys/fs/src/common/t.ts`
- `code/sys/fs/src/m.Pkg/m.Pkg.ts`
- `code/sys/fs/src/m.Pkg/m.Pkg.Dist.ts`
- `code/sys/fs/src/m.Pkg/m.Log.ts`
- `code/sys/fs/src/m.Pkg/u/u.log.children.ts`
- `code/sys/fs/src/m.Pkg/u/u.log.dist.ts`
- `code/sys/fs/src/m.Pkg/-test/-Pkg.Dist.test.ts`

Non-goals:

- do not change `Pkg` or `Dist` runtime export names;
- do not change distribution hash policy semantics;
- do not change canonical/legacy `dist.json` load classification;
- do not change `trustChildDist` behavior;
- do not refactor `@sys/std/pkg` in this pass.

## XHIGH review result

The old `m.Pkg/t.ts` surface was pre-canon flat: root, dist, log, compute, load, and verify contracts were exported as prefixed top-level aliases instead of concept namespaces.

The correct cut is a clean public namespace contract with `Pkg.Lib` first and filesystem distribution helpers nested under `Pkg.Dist.*`.

Important type-pool finding:

- `src/common/t.ts` previously explicitly exported `Pkg` from `@sys/std/t`.
- Keeping that shadow would make `t.Pkg` inside `@sys/fs` resolve to the std package namespace, not the filesystem-extended namespace.
- The refactor must promote the local `@sys/fs` `Pkg` type/namespace through `src/types.ts` and have `src/common/t.ts` explicitly export that local `Pkg`.

## Namespace factoring decisions

- `Pkg.Lib` is the root runtime contract and must appear first.
- `Pkg` remains a type alias for the standard package metadata value shape, matching `@sys/std/pkg`'s merged type/namespace pattern.
- `Pkg.Lib` extends `StdPkg.Lib`; do not write `t.Pkg.Lib` inside `m.Pkg/t.ts`, because that would self-reference the filesystem namespace.
- `Pkg.Dist.Lib` extends `StdPkg.Dist.Lib`; the filesystem package augments the std distribution helpers.
- `Pkg.Dist.Log` is earned because logging has a helper lib plus options.
- `Pkg.Dist.Compute` is earned because compute has a method, args, response, progress callback usage, and `trustChildDist` policy.
- `Pkg.Dist.Load` is earned because load has method, response, and kind classification.
- `Pkg.Dist.Verify` is earned because verify has method and response shapes.
- Do not introduce operation-generic `Options` or `Response` at `Pkg.Dist` root.

## Compatibility decision

Default S-tier move: clean namespace cut, no deprecated flat aliases.

Rationale:

- Flat aliases were only used in `code/sys/fs/src/m.Pkg` during review.
- Keeping `PkgDist*` aliases after migrating internal code would be transitional residue.
- `@sys/fs` is still `0.0.x`, and this is a type-surface cleanup rather than a runtime API change.

## Implementation steps

1. Refactor `src/m.Pkg/t.ts` to export `type Pkg = StdPkg` plus `export declare namespace Pkg`.
2. Put `Pkg.Lib` first, then `Pkg.Dist.Lib` first inside `Pkg.Dist`.
3. Move log, compute, load, and verify contracts under `Pkg.Dist.*`.
4. Update `src/common/t.ts` so the package type pool exposes the filesystem `Pkg` namespace instead of the std shadow.
5. Update runtime annotations to use `import { type t } from './common.ts'` and `t.Pkg.*` names.
6. Use the canonical `Json` helper for `dist.json` serialization without changing saved file byte shape.
7. Pin saved `dist.json` newline behavior in the package tests.
8. Search for stale flat names and remove residue.

## Search checks

Use content search only to locate residue; inspect unexpected hits with `read` before editing.

```sh
rg -n "\bPkg(?:FsLib|DistFsLib|DistLog|DistComputeArgs|DistComputeResponse|DistLoadResponse|DistVerifyResponse)\b|\bt\.PkgDist" /Users/phil/code/org.sys/sys/code/sys/fs/src
```

Expected result after the clean cut: no hits.

Also verify the type-pool export does not keep the std `Pkg` shadow:

```sh
rg -n "export type \{[^}]*Pkg[^}]*\} from '@sys/std/t'|export type \{ Pkg \} from '../types.ts'" /Users/phil/code/org.sys/sys/code/sys/fs/src/common/t.ts
```

Expected result: no std `Pkg` export, one local `Pkg` export.

## Proof plan

From `/Users/phil/code/org.sys/sys/code/sys/fs`:

```sh
deno task check
```

```sh
deno task test --trace-leaks ./src/m.Pkg
```

```sh
deno task test
```

## S-tier residue pass

Before calling complete:

- `src/m.Pkg/t.ts` is type-plane pure and imports no runtime modules.
- `Pkg.Lib` is first in the root namespace.
- `Pkg.Dist.Lib` is first in the `Pkg.Dist` namespace.
- Runtime implementations are typed through the canonical local `t` lane.
- No stale flat type references remain.
- `src/common/t.ts` exposes the local filesystem `Pkg` namespace, not the std namespace shadow.
- `Pkg.Dist.Lib` still extends the full std distribution helper surface.
- Runtime behavior for compute/load/verify/log remains unchanged.
- Saved `dist.json` still has exactly one trailing newline.

## TMIND failure review

- **Std shadow risk:** if `src/common/t.ts` continues exporting `Pkg` from `@sys/std/t`, `t.Pkg.Lib` in fs runtime code will not include fs-only `compute`, `load`, `verify`, or `Log`.
- **Recursive base risk:** inside `m.Pkg/t.ts`, extending `t.Pkg.Lib` after creating the local namespace can self-reference. Use `StdPkg.Lib` and `StdPkg.Dist.Lib` for base contracts.
- **Compatibility residue risk:** deprecated flat aliases are easy but lower finish quality unless there is an explicit compatibility reason.
- **Behavior drift risk:** `Json.stringify` already appends a trailing newline for multiline JSON; do not append another newline.
- **Scope creep risk:** `@sys/std/pkg` still has some flat `PkgDist*` support types. Do not widen this fs-local refactor into std unless separately requested.

## Final reality

Landed implementation commit:

- `465eb4f05 refactor(fs): namespace Pkg contract surface`

Actual changes:

- `m.Pkg/t.ts` now exports `type Pkg = StdPkg` plus a `Pkg` namespace with `Lib` first.
- Distribution-package filesystem contracts are namespaced under `Pkg.Dist.*` with `Dist.Lib` first.
- `src/common/t.ts` routes `Pkg` to the local package type surface, avoiding the old std `Pkg` shadow.
- Runtime files consume `t.Pkg.*` through the canonical local `common.ts` lane.
- `Pkg.Dist.compute` uses the canonical `Json` helper while preserving the one-trailing-newline `dist.json` byte contract.
- `-Pkg.Dist.test.ts` pins saved `dist.json` to exactly one trailing newline.

Final proof:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/fs && deno task check
```

```sh
cd /Users/phil/code/org.sys/sys/code/sys/fs && deno task test --trace-leaks ./src/m.Pkg
```

```sh
cd /Users/phil/code/org.sys/sys/code/sys/fs && deno task test
```

Final review result:

- SHIP after TMIND + S-tier review.
- Remaining risk: external consumers importing removed flat `Pkg*` type aliases need migration; internal repo residue search found no consumers.
