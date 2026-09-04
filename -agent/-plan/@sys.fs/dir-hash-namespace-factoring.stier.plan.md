dir-hash-namespace-factoring.stier.plan.md
- [x] 855fec8f6 refactor(fs): namespace DirHash contract surface

## Purpose

Bring `code/sys/fs/src/m.Dir.Hash` to the modern @sys namespace grammar without changing the public runtime surface.

Runtime values stay stable:

```ts
DirHash.*
Dir.Hash.*
Dir.Hash.Fmt.*
```

Target type surface becomes namespace-first:

```ts
t.DirHash.Lib
t.DirHash.Result
t.DirHash.Compute.Method
t.DirHash.Compute.Options
t.DirHash.Compute.ProgressEvent
t.DirHash.Verify.Method
t.DirHash.Verify.Input
t.DirHash.Verify.Response
```

## Scope

Package: `@sys/fs`.

Primary target:

- `code/sys/fs/src/m.Dir.Hash/t.ts`

Required adjacent updates:

- `code/sys/fs/src/m.Dir.Hash/m.DirHash.ts`
- `code/sys/fs/src/m.Dir.Hash/u.compute.ts`
- `code/sys/fs/src/m.Dir.Hash/u.verify.ts`
- `code/sys/fs/src/m.Dir.Hash/-.test.ts`
- `code/sys/fs/src/m.Dir/t.ts`
- `code/sys/fs/src/m.Pkg/t.ts`
- `code/sys/fs/src/m.Pkg/m.Pkg.Dist.ts`
- `code/sys/fs/src/m.Pkg/-test/-Pkg.Dist.test.ts`

Likely unchanged unless proof reveals stale docs or exports:

- `code/sys/fs/src/m.Dir.Hash/mod.ts`
- `code/sys/fs/src/m.Dir.Hash/common.ts`
- `code/sys/fs/src/types.ts`
- `code/sys/fs/src/common/t.ts`

Non-goals:

- do not change `DirHash` or `Dir.Hash` runtime export names;
- do not change composite hash semantics;
- do not change file traversal, filter, or progress ordering behavior;
- do not refactor `m.Pkg` namespace shape beyond the minimal downstream type references required by this change;
- do not introduce new hashing primitives or bypass `@sys/crypto` / `@sys/fs` surfaces.

## XHIGH review result

The current `m.Dir.Hash/t.ts` surface is pre-canon flat:

- `DirHashLib`
- `DirHashComputeOptions`
- `DirHashComputeProgressEvent`
- `DirHash`
- `DirHashVerifyResponse`

This violates the modern contract shape because the runtime noun is already `DirHash`, but the public type contract is spread across prefixed aliases. The correct cut is a clean public namespace contract with `DirHash.Lib` first and operation-specific contracts nested under `DirHash.Compute` and `DirHash.Verify`.

Important correctness findings:

- `DirHash.verify` does not truthfully accept a raw hash string. String input is treated as a path to a JSON file containing `{ hash }`. The modern type should expose `DirHash.Verify.Input = t.CompositeHash | t.StringPath`, not a hash-string alias.
- `DirHash.compute` emits progress for hashed files after filtering. The event `path` is a relative hash-part path, so `t.StringRelativePath` is more truthful than generic `t.StringPath`.
- `DirHash.Result` should be a strict output shape with readonly fields. Implementation files must avoid mutating values typed as returned output objects.
- `m.Dir.Hash/m.DirHash.ts` currently imports `DirHashLib` directly from `./t.ts`. The modern call-site shape should route through `import { type t } from './common.ts'` and type the value as `t.DirHash.Lib`.
- `m.Dir.Hash/u.compute.ts` imports `Hash` but does not use it. Remove this touched-file residue during the refactor.
- `m.Dir.Hash/-.test.ts` contains direct `Deno.writeTextFile` and raw `JSON.stringify` in a touched test path. Route that through the package filesystem/JSON surface while preserving the test behavior.
- `src/common/t.ts` already re-exports the package type surface and has no `DirHash` shadow like the known `Pkg` case. No common type-pool surgery is expected.

Search evidence before this plan:

```sh
rg -n "\bDirHash(?:Lib|ComputeOptions|ComputeProgressEvent|VerifyResponse)\b|\bt\.DirHash(?:Lib|ComputeOptions|ComputeProgressEvent|VerifyResponse)\b|\bt\.DirHash\b" code/sys/fs/src
```

Expected code owners found before refactor:

- `m.Dir.Hash` implementation and tests;
- `m.Dir/t.ts` parent lib surface;
- `m.Pkg` dist hash progress plumbing;
- existing `-agent` planning docs may contain historical references and should not be counted as implementation residue.

## Target type shape

Use a single root namespace with `Lib` first, then root result shape, then earned operation sub-namespaces.

```ts
import type { t } from './common.ts';

/**
 * Directory hashing contracts.
 */
export declare namespace DirHash {
  /** Directory hashing helper library. */
  export type Lib = {
    /** Hash related console logging helpers. */
    readonly Fmt: t.HashFmtLib;

    /** Calculate the hash of a directory. */
    readonly compute: Compute.Method;

    /** Verify a directory against a composite hash or hash file. */
    readonly verify: Verify.Method;
  };

  /** Result from hashing a directory. */
  export type Result = {
    /** The composite hash value. */
    readonly hash: t.CompositeHash;

    /** Path to the base directory the relative filepath hashes pertain to. */
    readonly dir: t.StringDir;

    /** Flag indicating if the directory exists. */
    readonly exists: boolean;

    /** Error details if any occurred. */
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
    ) => Promise<DirHash.Result>;

    /** Options passed to `DirHash.compute`. */
    export type Options = {
      filter?: t.Fs.Path.Filter;
      onProgress?: (e: ProgressEvent) => t.Awaitable<void>;
    };

    /** Progress emitted for each hashed file. */
    export type ProgressEvent = {
      readonly dir: t.StringDir;
      readonly path: t.StringRelativePath;
      readonly current: number;
      readonly total: number;
    };
  }

  /**
   * Directory hash verification contracts.
   */
  export namespace Verify {
    /** Verify a directory against a composite hash or hash file. */
    export type Method = (dir: t.StringDir, input: Input) => Promise<Response>;

    /** Composite hash object or path to a JSON file containing `{ hash }`. */
    export type Input = t.CompositeHash | t.StringPath;

    /** Result from verifying a directory hash. */
    export type Response = DirHash.Result & {
      readonly is: t.HashVerifyResponse['is'];
    };
  }
}
```

## Namespace factoring decisions

- `DirHash.Lib` is the root runtime contract and must appear first.
- `DirHash.Result` names the stable output shape without overloading the root namespace as a data type.
- `DirHash.Compute` is earned because compute owns method, options, and progress-event contracts.
- `DirHash.Verify` is earned because verify owns method, input, and response contracts.
- `DirHash.Verify.Input` is earned because it corrects an existing truthfulness bug and gives downstream callers a stable contract noun.
- Do not add a `DirHash.Fmt` sub-namespace. Formatting is delegated to `t.HashFmtLib` from `@sys/crypto`; `DirHash` only exposes it as `Fmt`.
- Do not introduce a generic root `Options` or `Response`; operation-specific contracts stay under their operation namespace.

## Compatibility decision

Recommended S-tier move: make the namespace cut cleanly and do not keep deprecated flat aliases by default.

Rationale:

- The old flat aliases are internal to `@sys/fs` in the checked code paths.
- Keeping aliases after migrating internal code would be transitional residue.
- `@sys/fs` is still `0.0.x`, and this is a type-surface cleanup with stable runtime values.
- The root data shape should move to `DirHash.Result`; keeping `type DirHash = DirHash.Result` would preserve an old ambiguity between the library noun and the result noun.

Fallback only if the human requests a compatibility window or proof reveals downstream breakage:

```ts
/** @deprecated Use `DirHash.Lib`. */
export type DirHashLib = DirHash.Lib;
/** @deprecated Use `DirHash.Compute.Options`. */
export type DirHashComputeOptions = DirHash.Compute.Options;
/** @deprecated Use `DirHash.Compute.ProgressEvent`. */
export type DirHashComputeProgressEvent = DirHash.Compute.ProgressEvent;
/** @deprecated Use `DirHash.Result`. */
export type DirHashResult = DirHash.Result;
/** @deprecated Use `DirHash.Verify.Response`. */
export type DirHashVerifyResponse = DirHash.Verify.Response;
```

Do not add these aliases silently; choose them deliberately as compatibility, not canon. Avoid reusing the old `DirHash` result alias name as compatibility because it conflicts conceptually with the namespace noun.

## Implementation steps

1. Refactor `src/m.Dir.Hash/t.ts` to `export declare namespace DirHash` with `Lib` first.
2. Move the compute contracts under `DirHash.Compute` and verify contracts under `DirHash.Verify`.
3. Change verify input typing from string hash semantics to path-or-composite semantics: `t.DirHash.Verify.Input`.
4. Type returned data as readonly output contracts.
5. Update `m.Dir.Hash/m.DirHash.ts` to import `type t` from `./common.ts` and type the runtime value as `t.DirHash.Lib`.
6. Update `m.Dir.Hash/u.compute.ts`:
   - type `compute` as `t.DirHash.Compute.Method`;
   - type local option wrangling with `t.DirHash.Compute.Options`;
   - return `t.DirHash.Result` without mutating a typed readonly result object;
   - remove the unused `Hash` import.
7. Update `m.Dir.Hash/u.verify.ts`:
   - type `verify` as `t.DirHash.Verify.Method`;
   - type response as `t.DirHash.Verify.Response`;
   - return the readonly response from local accumulated `hash`, `is`, and `error` values rather than mutating a typed response object.
8. Update `m.Dir/t.ts` from `t.DirHashLib` to `t.DirHash.Lib`.
9. Update downstream progress-event references:
   - `t.DirHashComputeProgressEvent` → `t.DirHash.Compute.ProgressEvent`.
10. Update downstream verify-input references where they are part of the public contract:
    - prefer `t.DirHash.Verify.Input` for any parameter that is passed to `DirHash.verify` and follows the same semantics.
11. In touched tests, keep behavior assertions stable and fix obvious residue only:
    - update type names;
    - fix the `computer → with filtered set of files` typo to `compute → with filtered set of files`;
    - replace direct `Deno.writeTextFile(... JSON.stringify(...))` with the package filesystem/JSON surface and assert write success.
12. Keep `mod.ts`, `common.ts`, `types.ts`, and `common/t.ts` unchanged unless type-check proof reveals a real export or type-pool issue.

## Search checks

Use content search only to locate residue; inspect unexpected hits with `read` before editing.

Old flat type names should disappear from implementation and tests:

```sh
rg -n --glob '!**/-agent/**' "\b(DirHashLib|DirHashComputeOptions|DirHashComputeProgressEvent|DirHashVerifyResponse)\b" code/sys/fs/src
```

Expected result after a clean cut: no hits.

Standalone old `t.DirHash` result typing should disappear from implementation and tests:

```sh
rg -n --glob '!**/-agent/**' "\bt\.DirHash\b" code/sys/fs/src
```

Expected result after a clean cut: hits should all be namespace-qualified forms such as `t.DirHash.Lib`, `t.DirHash.Result`, `t.DirHash.Compute.*`, or `t.DirHash.Verify.*`. Inspect any standalone `t.DirHash` hit.

Direct type imports from the module `t.ts` should disappear:

```sh
rg -n --glob '!**/-agent/**' "from './t\.ts'|from \"./t\.ts\"" code/sys/fs/src/m.Dir.Hash
```

Expected result after a clean cut: no hits.

Direct filesystem/JSON runtime bypass in the touched test should disappear:

```sh
rg -n --glob '!**/-agent/**' "Deno\.writeTextFile|JSON\.stringify" code/sys/fs/src/m.Dir.Hash
```

Expected result after cleanup: no hits.

## Proof plan

From `code/sys/fs`:

```sh
deno task check
```

```sh
deno task test --trace-leaks ./src/m.Dir.Hash ./src/m.Dir ./src/m.Pkg
```

If those are clean and the change is ready to close, run the full package test:

```sh
deno task test
```

## S-tier residue pass

Before calling complete:

- `src/m.Dir.Hash/t.ts` is type-plane pure and imports no runtime modules.
- `DirHash.Lib` is first in the root namespace.
- `DirHash.Compute.Method`, `DirHash.Verify.Method`, and nested operation contracts are stable and scanable.
- Verify input docs and types match runtime behavior: composite hash object or path to JSON containing `{ hash }`.
- Progress event docs and types match runtime behavior: event path is relative to the hashed directory.
- Runtime values remain stable: `DirHash`, `Dir.Hash`, `Dir.Hash.Fmt`, `compute`, and `verify` are unchanged at the value surface.
- Runtime implementations are typed through `import { type t } from './common.ts'`, not direct imports from `./t.ts`.
- No stale flat type references remain outside `-agent` notes unless a compatibility block was deliberately chosen.
- Touched output objects are no longer mutated through readonly public result types.
- Touched tests avoid direct `Deno.*` and raw `JSON.*` where package helpers are available.
- Existing behavior assertions are not churned unnecessarily.

## XHIGH failure review

- **Truthful input risk:** keeping `t.StringHash` on `verify` would preserve a lie. Runtime string input is a file path, not a raw digest.
- **Root noun ambiguity risk:** keeping the old `DirHash` result alias would make `DirHash` mean both the library namespace and the result payload. Use `DirHash.Result` instead.
- **Readonly implementation risk:** if result fields become readonly while implementation still mutates a typed result object, type-check will fail or force unsafe casts. Accumulate locals and return once.
- **Over-factoring risk:** adding extra namespaces for `Fmt`, `Path`, or `Progress` would be speculative. Only `Compute` and `Verify` are earned by multiple public contracts.
- **Pkg scope risk:** `m.Pkg` still has its own flat namespace refactor plan. Do not widen this pass into a full `Pkg` rewrite; update only the required `DirHash` references.
- **Plan-note residue risk:** old names may remain in historical `-agent` notes. Do not treat those as implementation residue, but update active plans when doing so avoids future confusion.
- **Behavior drift risk:** replacing test file writes with `Fs.writeJson` must assert write success so failures do not become silent.
