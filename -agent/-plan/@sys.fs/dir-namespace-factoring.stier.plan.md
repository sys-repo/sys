# Dir namespace factoring S-tier plan

- [ ] refactor(fs): namespace Dir contract surface

## Purpose

Bring `code/sys/fs/src/m.Dir` and its directory-hash sub-surface to the modern @sys namespace grammar without changing runtime behavior.

Runtime values stay stable:

```ts
Dir.*
Dir.Hash.*
DirHash.*
```

Target public type surface becomes namespace-first:

```ts
t.Dir.Lib
t.Dir.Hash.Lib
t.Dir.Hash.Result
t.Dir.Hash.Compute.Method
t.Dir.Hash.Compute.Options
t.Dir.Hash.Compute.ProgressEvent
t.Dir.Hash.Verify.Method
t.Dir.Hash.Verify.Response
```

## Scope

Package: `@sys/fs`.

Primary target:

- `code/sys/fs/src/m.Dir/t.ts`

Required adjacent updates:

- `code/sys/fs/src/types.ts`
- `code/sys/fs/src/m.Dir/m.Dir.ts`
- `code/sys/fs/src/m.Dir.Hash/m.DirHash.ts`
- `code/sys/fs/src/m.Dir.Hash/u.compute.ts`
- `code/sys/fs/src/m.Dir.Hash/u.verify.ts`
- `code/sys/fs/src/m.Dir.Hash/-.test.ts`
- `code/sys/fs/src/m.Pkg/t.ts`
- `code/sys/fs/src/m.Pkg/m.Pkg.Dist.ts`
- `code/sys/fs/src/m.Pkg/-test/-Pkg.Dist.test.ts`

Stale file expected to remove after migration:

- `code/sys/fs/src/m.Dir.Hash/t.ts`

Expected unchanged unless proof reveals stale docs or exports:

- `code/sys/fs/src/m.Dir/mod.ts`
- `code/sys/fs/src/m.Dir.Hash/mod.ts`
- `code/sys/fs/src/m.Dir/common.ts`
- `code/sys/fs/src/m.Dir.Hash/common.ts`
- `code/sys/fs/deno.json`

Non-goals:

- do not change `Dir` runtime export names;
- do not change the internal `DirHash` runtime export name;
- do not change directory hash digest semantics;
- do not change `Dir.Hash.compute` filter behavior;
- do not change progress callback timing or current/total semantics;
- do not change `Dir.Hash.verify` file/object hash input behavior;
- do not refactor `Pkg` namespace factoring in this pass beyond replacing Dir hash type references.

## XHIGH review result

The current directory contract is pre-canon flat:

- `FsDirLib`
- `DirHashLib`
- `DirHashComputeOptions`
- `DirHashComputeProgressEvent`
- `DirHash`
- `DirHashVerifyResponse`

The runtime noun is already `Dir`, and the hash sub-surface is already exposed to users as `Dir.Hash`. The type contract should therefore read as `Dir.Lib` and `Dir.Hash.*`, not as separate prefixed aliases.

Important type-surface finding:

- Do not split exported `Dir` namespace declarations between `m.Dir/t.ts` and `m.Dir.Hash/t.ts` while `src/types.ts` star-exports both files. Star-exported duplicate names are a fragile boundary and can produce ambiguous public exports instead of reliable namespace merging.
- The S-tier cut is to make `m.Dir/t.ts` the single public `Dir` namespace owner, fold the small hash contract into `Dir.Hash`, and stop exporting `m.Dir.Hash/t.ts` from `src/types.ts`.
- Because the folded hash type surface is small, a separate factor file is not earned yet. Keeping `m.Dir.Hash/t.ts` only as aliases would be transitional residue.

Current repo search shows the flat directory-hash type names are limited to `@sys/fs` internals and tests, with `m.Pkg` consuming only the hash progress event. The runtime value name `DirHash` has legitimate internal use and should remain.

## Target type shape

`code/sys/fs/src/m.Dir/t.ts` should own the full public contract:

```ts
import type { t } from './common.ts';

/**
 * Filesystem directory helper contracts.
 */
export declare namespace Dir {
  /** Helpers for working with filesystem directories. */
  export type Lib = {
    /** Directory hash helpers. */
    readonly Hash: Hash.Lib;
  };

  /**
   * Directory hash contracts.
   */
  export namespace Hash {
    /** Directory hash helper library. */
    export type Lib = {
      /** Hash-related console formatting helpers. */
      readonly Fmt: t.HashFmtLib;

      /** Calculate the hash of a directory. */
      compute: Compute.Method;

      /** Verify a directory against a composite hash or hash file. */
      verify: Verify.Method;
    };

    /** Directory hash operation result. */
    export type Result = {
      /** The composite hash value. */
      readonly hash: t.CompositeHash;

      /** Absolute path to the base directory the relative file hashes pertain to. */
      readonly dir: t.StringDir;

      /** Whether the directory path exists. */
      readonly exists: boolean;

      /** Error details when the operation failed. */
      readonly error?: t.StdError;
    };

    /**
     * Directory hash computation contracts.
     */
    export namespace Compute {
      /** Calculate the hash of a directory. */
      export type Method = (
        dir: t.StringDir,
        options?: Options | t.Fs.Path.Filter,
      ) => Promise<Result>;

      /** Options passed to `Dir.Hash.compute`. */
      export type Options = {
        filter?: t.Fs.Path.Filter;
        onProgress?: (e: ProgressEvent) => void | Promise<void>;
      };

      /** Progress event emitted while hashing files in a directory. */
      export type ProgressEvent = {
        readonly dir: t.StringDir;
        readonly path: t.StringPath;
        readonly current: number;
        readonly total: number;
      };
    }

    /**
     * Directory hash verification contracts.
     */
    export namespace Verify {
      /** Verify a directory against a composite hash or hash file. */
      export type Method = (
        dir: t.StringDir,
        hash: t.StringHash | t.CompositeHash,
      ) => Promise<Response>;

      /** Response from `Dir.Hash.verify`. */
      export type Response = Result & {
        readonly is: t.HashVerifyResponse['is'];
      };
    }
  }
}
```

## Namespace factoring decisions

- `Dir.Lib` is the root runtime contract and must appear first in `Dir`.
- `Dir.Hash.Lib` is the hash sub-surface contract and must appear first in `Dir.Hash`.
- `Dir.Hash` is earned because one runtime concept currently owns a lib, compute options, progress event, operation result, and verify response.
- `Dir.Hash.Compute` is earned because compute has a method, options, and progress event.
- `Dir.Hash.Verify` is earned because verify has a method and response shape.
- `Dir.Hash.Result` is kept at the hash root because compute and verify share the same directory/hash/existence/error snapshot.
- Output fields should become `readonly` to match canon. Implementations should stop mutating objects typed as public outputs and instead assemble final response objects from local variables.
- Do not introduce `Dir.Hash.Fmt` as a type namespace. `Fmt` is a borrowed hash-formatting library surface from `@sys/crypto`, and no new local Fmt type family exists here.

## Compatibility decision

Recommended S-tier move: make the namespace cut cleanly and do not keep flat aliases by default.

Rationale:

- The old flat type aliases are not referenced outside the checked `@sys/fs` internals/tests.
- `@sys/fs` is still `0.0.x`.
- Keeping deprecated `FsDirLib` / `DirHash*` aliases after migrating internal code would leave low-signal transitional residue.

Fallback only if the human requests a compatibility window or proof reveals downstream breakage:

```ts
/** @deprecated Use `Dir.Lib`. */
export type FsDirLib = Dir.Lib;
/** @deprecated Use `Dir.Hash.Lib`. */
export type DirHashLib = Dir.Hash.Lib;
/** @deprecated Use `Dir.Hash.Compute.Options`. */
export type DirHashComputeOptions = Dir.Hash.Compute.Options;
/** @deprecated Use `Dir.Hash.Compute.ProgressEvent`. */
export type DirHashComputeProgressEvent = Dir.Hash.Compute.ProgressEvent;
/** @deprecated Use `Dir.Hash.Result`. */
export type DirHash = Dir.Hash.Result;
/** @deprecated Use `Dir.Hash.Verify.Response`. */
export type DirHashVerifyResponse = Dir.Hash.Verify.Response;
```

Do not add these aliases silently; choose them deliberately as compatibility, not canon.

## Implementation steps

1. Refactor `src/m.Dir/t.ts` to export the `Dir` namespace shown above.
2. Remove `src/m.Dir.Hash/t.ts` after all direct imports from it are gone.
3. Update `src/types.ts`:
   - keep `export type * from './m.Dir/t.ts';`;
   - remove `export type * from './m.Dir.Hash/t.ts';`.
4. Update `src/m.Dir/m.Dir.ts`:
   - replace direct `FsDirLib` import with `import { type t } from './common.ts';`;
   - type `Dir` as `t.Dir.Lib`.
5. Update `src/m.Dir.Hash/m.DirHash.ts`:
   - replace direct `DirHashLib` import with `import { type t } from './common.ts';`;
   - type `DirHash` as `t.Dir.Hash.Lib`.
6. Update `src/m.Dir.Hash/u.compute.ts`:
   - type `compute` as `t.Dir.Hash.Compute.Method` or `t.Dir.Hash.Lib['compute']`;
   - replace `t.DirHash` with `t.Dir.Hash.Result`;
   - replace `t.DirHashComputeOptions` with `t.Dir.Hash.Compute.Options`;
   - remove unused imports while preserving behavior;
   - avoid mutating a response object typed with readonly output fields.
7. Update `src/m.Dir.Hash/u.verify.ts`:
   - type `verify` as `t.Dir.Hash.Verify.Method` or `t.Dir.Hash.Lib['verify']`;
   - replace `t.DirHashVerifyResponse` with `t.Dir.Hash.Verify.Response`;
   - avoid mutating a response object typed with readonly output fields.
8. Update Pkg consumers:
   - `t.DirHashComputeProgressEvent` → `t.Dir.Hash.Compute.ProgressEvent` in `m.Pkg/t.ts`;
   - same replacement in `m.Pkg/m.Pkg.Dist.ts`;
   - same replacement in `m.Pkg/-test/-Pkg.Dist.test.ts`.
9. If the Pkg namespace factoring plan lands first, update the corresponding nested Pkg locations instead; the Dir-owned target remains `t.Dir.Hash.Compute.ProgressEvent`.
10. Keep runtime imports of `DirHash` unchanged where they refer to the value exported by `m.Dir.Hash/mod.ts`.
11. Run stale-name searches and remove all non-compat flat type references.

## Search checks

Use content search only to locate residue; inspect unexpected hits with `read` before editing.

From `/Users/phil/code/org.sys/sys`:

```sh
rg -n "\bFsDirLib\b|\bDirHash(?:Lib|ComputeOptions|ComputeProgressEvent|VerifyResponse)\b|\btype DirHash\b|\bt\.DirHash" /Users/phil/code/org.sys/sys/code/sys/fs/src
```

Expected result after a clean cut: no hits.

Runtime value `DirHash` should still have legitimate hits such as imports from `../m.Dir.Hash/mod.ts` and the `export const DirHash` implementation.

Verify the package type surface no longer exports the old hash type spine:

```sh
rg -n "m\.Dir\.Hash/t\.ts|m\.Dir/t\.ts" /Users/phil/code/org.sys/sys/code/sys/fs/src/types.ts
```

Expected result: one `m.Dir/t.ts` export, no `m.Dir.Hash/t.ts` export.

Verify runtime code does not directly import the removed type file:

```sh
rg -n "from './t\.ts'|from \"./t\.ts\"" /Users/phil/code/org.sys/sys/code/sys/fs/src/m.Dir /Users/phil/code/org.sys/sys/code/sys/fs/src/m.Dir.Hash
```

Expected result: no runtime-file hits. The remaining `t.ts` file itself is the contract owner, not a caller.

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

If those are clean and the change is ready to close, run the full package test:

```sh
deno task test
```

## S-tier residue pass

Before calling complete:

- `src/m.Dir/t.ts` is type-plane pure and imports no runtime modules.
- `Dir.Lib` is first in the root namespace.
- `Dir.Hash.Lib` is first in the `Dir.Hash` namespace.
- Hash compute/verify method types live under their operation namespaces.
- Shared hash output shape is named once as `Dir.Hash.Result`.
- Public output fields are readonly.
- Runtime implementations are typed through `import { type t } from './common.ts'`, not direct imports from `./t.ts`.
- `src/types.ts` exports `m.Dir/t.ts` but not `m.Dir.Hash/t.ts`.
- `m.Dir.Hash/t.ts` is removed if it has no remaining job.
- No stale flat type references remain unless a deliberate deprecated compatibility block was chosen.
- Runtime behavior for compute, verify, formatting, and progress callbacks remains unchanged.
- Runtime value `DirHash` remains stable for internal imports and tests.
- Tests are not churned beyond type-name updates and stronger surface checks if needed.

## TMIND failure review

- **Barrel merge risk:** exporting `Dir` from multiple type files through `export *` can create an ambiguous type surface. Avoid by making `m.Dir/t.ts` the only public `Dir` namespace owner.
- **Residual alias risk:** leaving `m.Dir.Hash/t.ts` with old flat aliases makes the refactor look done while preserving the old contract. Default to removal.
- **Runtime/type name confusion:** `DirHash` remains a runtime value. Do not eliminate or rename it unless a separate runtime API refactor is explicitly requested.
- **Readonly mutation risk:** changing output types to readonly can break current implementation mutation. Fix implementation shape rather than weakening the type contract.
- **Pkg coupling risk:** `m.Pkg` currently references only the Dir hash progress-event type. Replace that reference narrowly; do not widen into the Pkg namespace refactor.
- **Compatibility temptation:** deprecated aliases are easy but lower finish quality unless there is a confirmed external compatibility need.
- **Behavior drift risk:** do not alter path normalization, relative hash part generation, filter invocation, missing-directory behavior, or verify error aggregation while moving types.
