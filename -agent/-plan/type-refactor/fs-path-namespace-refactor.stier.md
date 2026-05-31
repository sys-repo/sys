# @sys/fs m.Path namespace refactor

- [x] e1b5b1980 refactor(fs): namespace filesystem path types

## Scope

Refactor `code/sys/fs/src/m.Path/t.ts` from its legacy flat type spine to the canonical namespace spine used by modern `@sys/*` modules.

Runtime surface stays unchanged:

```ts
export { Path } from './m.Path.ts';
```

The type refactor is contract-only and must keep `t.ts` type-plane pure.

## Current legacy flat names

`code/sys/fs/src/m.Path/t.ts` currently exposes:

```ts
export type FsPathLib = t.Path.Lib & { ... };
export type FsPathTrimCwdOptions = { ... };
```

These names are still consumed by in-scope `@sys/fs` callers:

- `code/sys/fs/src/m.Path/m.Path.ts`
  - `t.FsPathLib`
  - `t.FsPathTrimCwdOptions`
- `code/sys/fs/src/m.Fs/t.ts`
  - `t.FsPathLib`

## Target namespace shape

Use `FsPath` as the root type namespace.

Rationale: the runtime value is exported as `Path`, but `t.Path` is already the standard `@sys/std` path namespace imported through the local type pool. `FsPath` names the package-specific filesystem-aware extension without colliding with the standard path contract.

Target shape:

```ts
import type { t } from './common.ts';

/**
 * Filesystem-aware path helpers.
 */
export declare namespace FsPath {
  /** Runtime library surface. */
  export type Lib = t.Path.Lib & {
    /** Convert the path to its parent directory if it is not already a directory target. */
    asDir(path: t.StringPath): Promise<t.StringPath>;

    /** Removes the CWD (current-working-directory) from the given path if it exists. */
    trimCwd(path: t.StringPath, options?: TrimCwdOptions | boolean): t.StringPath;

    /** Current working directory. */
    cwd(): t.StringDir;
  };

  /** Options for the `Path.trimCwd` method. */
  export type TrimCwdOptions = {
    /** Flag indicating if the './' prefix should be retained (default: false). */
    prefix?: boolean;

    /** The CWD to use (default: current-working-directory). */
    cwd?: t.StringPath;
  };
}
```

## Files expected to change

### `code/sys/fs/src/m.Path/t.ts`

Why:

- Replace the flat `FsPathLib` / `FsPathTrimCwdOptions` exports with `FsPath.Lib` / `FsPath.TrimCwdOptions`.
- Keep `Lib` first within the namespace.
- Keep detail type ownership under the root concept.
- Do not add runtime values or side effects.

### `code/sys/fs/src/m.Path/m.Path.ts`

Why:

- Migrate the implementation type binding from `t.FsPathLib` to `t.FsPath.Lib`.
- Migrate helper return annotation from `t.FsPathTrimCwdOptions` to `t.FsPath.TrimCwdOptions`.
- Preserve implementation behavior byte-for-byte except type references.

Expected updates:

```ts
type L = t.FsPath.Lib;
```

```ts
trimCwdOptions(input: Parameters<L['trimCwd']>[1]): t.FsPath.TrimCwdOptions
```

### `code/sys/fs/src/m.Fs/t.ts`

Why:

- Migrate the aggregate filesystem type surface to the canonical path namespace.
- Preserve the public `Fs.Lib` shape while updating type references.

Expected updates:

```ts
trimCwd: t.FsPath.Lib['trimCwd'];
```

```ts
readonly Path: t.FsPath.Lib;
```

## Files not expected to change

### `code/sys/fs/src/types.ts`

Already re-exports `./m.Path/t.ts`. The namespace export remains visible through the package type surface without changing the barrel.

### `code/sys/fs/src/common/t.ts`

Already re-exports `../types.ts`; no new import lane is required.

### `code/sys/fs/src/m.Path/mod.ts`

Runtime value export remains unchanged.

## Sub-namespace opportunities

No sub-namespace is warranted for this pass.

`TrimCwdOptions` is a single detail type owned by `FsPath.Lib['trimCwd']`. A deeper shape such as `FsPath.TrimCwd.Options` would over-structure the current contract.

## Legacy alias disposition

Do not add compatibility aliases.

All live callers of the flat names are inside the refactor scope and are cleanly migratable in the same change.

Alias retention would require a concrete live caller that cannot be migrated in this pass. Current evidence does not show one.

Known non-code references:

- `code/sys/std/-agent/-plan/path-type-namespace-refactor.plan.md`

Those are historical planning-note references and are not type consumers.

## Import and reference updates outside target `t.ts`

Update only in-scope type references:

- `t.FsPathLib` → `t.FsPath.Lib`
- `t.FsPathTrimCwdOptions` → `t.FsPath.TrimCwdOptions`

Do not rename runtime `Path`.
Do not alter the `@sys/std` `t.Path` imported type namespace.
Do not widen `Fs.Lib` or `Fs.Path` behavior.

## Verification

Run from the nearest module directory:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/fs
deno task test --trace-leaks ./src/m.Path
deno task check
```

Final scans:

```sh
rg -n "FsPathLib|FsPathTrimCwdOptions" /Users/phil/code/org.sys/sys/code/sys/fs
rg -n "export type [A-Za-z0-9_]+Lib\\s*=" /Users/phil/code/org.sys/sys/code/sys/fs/src
```

Expected final state:

- no `FsPathLib` or `FsPathTrimCwdOptions` references in live `@sys/fs` source;
- `m.Path/t.ts` exposes `FsPath.Lib` and `FsPath.TrimCwdOptions` only;
- any remaining `*Lib` scan hits are either already inside modern namespaces or separate follow-up candidates, especially `code/sys/fs/src/m.Fs/t/t.Fmt.ts`.

## HOLD conditions

HOLD before editing if any of these appear:

- a live consumer outside `@sys/fs` imports or references `FsPathLib` or `FsPathTrimCwdOptions` and cannot be migrated in the same clean refactor;
- `types.ts` or `common/t.ts` no longer exposes `FsPath` through the normal type pool after the target edit;
- the change would require adding runtime values to `t.ts`;
- verification shows behavior failures outside type reference migration;
- alias removal becomes contentious and needs a dedicated compatibility-alias decision.

## Review gates

Before implementation, reject any edit that:

- creates a deprecated compatibility alias block without exact current caller proof;
- moves runtime values, imports runtime modules, or introduces side effects into `t.ts`;
- changes runtime behavior of `Path`, `Fs.Path`, or `Fs.trimCwd`;
- conflates `FsPath` with the existing standard `t.Path` namespace.
