# Dir namespace factoring S-tier plan

- [x] e94e5d8de refactor(fs): namespace Dir contract surface

## Purpose

Bring `code/sys/fs/src/m.Dir` and its directory-hash sub-surface to the modern @sys namespace grammar without changing runtime behavior.

Runtime values stay stable:

```ts
Dir.*
Dir.Hash.*
DirHash.*
```

Target public type surface is namespace-first:

```ts
t.Dir.Lib
t.Dir.Hash.Lib
t.Dir.Hash.Result
t.Dir.Hash.Compute.Method
t.Dir.Hash.Compute.Options
t.Dir.Hash.Compute.ProgressEvent
t.Dir.Hash.Verify.Method
t.Dir.Hash.Verify.Input
t.Dir.Hash.Verify.Response
```

## Scope

Primary contract owner:

- `code/sys/fs/src/m.Dir/t.ts`

Adjacent runtime and consumer updates:

- `code/sys/fs/src/types.ts`
- `code/sys/fs/src/m.Dir/m.Dir.ts`
- `code/sys/fs/src/m.Dir.Hash/m.DirHash.ts`
- `code/sys/fs/src/m.Dir.Hash/u.compute.ts`
- `code/sys/fs/src/m.Dir.Hash/u.verify.ts`
- `code/sys/fs/src/m.Dir.Hash/-.test.ts`
- `code/sys/fs/src/m.Pkg/t.ts`
- `code/sys/fs/src/m.Pkg/m.Pkg.Dist.ts`
- `code/sys/fs/src/m.Pkg/-test/-Pkg.Dist.test.ts`

Removed stale type spine:

- `code/sys/fs/src/m.Dir.Hash/t.ts`

## XHIGH review result

The prior shape split the directory surface across `FsDirLib` plus a separate `DirHash` type namespace. That was not the runtime noun cut: callers see `Dir.Hash`, so the public contract should live under `Dir.Hash.*`.

Correctness decisions:

- `m.Dir/t.ts` is the single public `Dir` namespace owner.
- `Dir.Hash` is earned because one sub-surface owns a lib, shared result, compute method/options/progress, and verify method/input/response.
- `Dir.Hash.Verify.Input` is retained because string verify input is a path to JSON containing `{ hash }`, not a raw hash string.
- `Dir.Hash.Compute.ProgressEvent.path` is `t.StringRelativePath`, matching the path emitted relative to the hashed directory.
- Public result fields are readonly; implementations assemble final response objects rather than mutating public outputs.
- The internal runtime value `DirHash` remains stable.
- Deprecated flat aliases are not retained.

## Proof plan

From `/Users/phil/code/org.sys/sys/code/sys/fs`:

```sh
deno task check
```

```sh
deno task test --trace-leaks ./src/m.Dir
```

```sh
deno task test --trace-leaks ./src/m.Dir.Hash
```

```sh
deno task test --trace-leaks ./src/m.Pkg
```

Final package proof:

```sh
deno task test
```

## Actual changes

Landed commit:

- `e94e5d8de refactor(fs): namespace Dir contract surface`

Mechanical changes:

- `m.Dir/t.ts` now owns `Dir.Lib` and nested `Dir.Hash.*` contracts.
- Removed stale `m.Dir.Hash/t.ts` type spine from the package type surface.
- Runtime implementations now type through `t.Dir.Lib`, `t.Dir.Hash.Lib`, `t.Dir.Hash.Compute.Method`, and `t.Dir.Hash.Verify.Method`.
- Pkg dist hash-progress consumers now use `t.Dir.Hash.Compute.ProgressEvent`.
- Runtime value names stayed stable: `Dir`, `Dir.Hash`, and internal `DirHash`.

## Completion proof

Completed proof runs from `/Users/phil/code/org.sys/sys/code/sys/fs`:

- `deno task check`
- `deno task test --trace-leaks ./src/m.Dir`
- `deno task test --trace-leaks ./src/m.Dir.Hash`
- `deno task test --trace-leaks ./src/m.Pkg`
- `deno task test`

Residue searches:

- no stale `FsDirLib`, flat `DirHash*` type aliases, `type DirHash`, or `t.DirHash` references outside `-agent` notes;
- no runtime direct imports from removed `m.Dir.Hash/t.ts`;
- no `src/types.ts` export of `m.Dir.Hash/t.ts`.

## Final review

TMIND + S-tier review result: SHIP.

Remaining risk:

- Intentional type compatibility break for external consumers of old flat aliases (`FsDirLib`, `DirHash*`). Runtime surface is unchanged.

## S-tier residue pass

Final state:

- `src/m.Dir/t.ts` is type-plane pure and owns `Dir.Lib` and `Dir.Hash.*`.
- `Dir.Lib` is first in the root namespace.
- `Dir.Hash.Lib` is first in `Dir.Hash`.
- `src/types.ts` exports `m.Dir/t.ts` and no longer exports `m.Dir.Hash/t.ts`.
- `src/m.Dir.Hash/t.ts` is removed.
- No stale flat type references remain outside spent `-agent` notes.
- Runtime values remain stable: `Dir`, `Dir.Hash`, `DirHash`, `compute`, and `verify`.
- Pkg consumers use `t.Dir.Hash.Compute.ProgressEvent` and `t.Dir.Hash.Verify.Input`.
