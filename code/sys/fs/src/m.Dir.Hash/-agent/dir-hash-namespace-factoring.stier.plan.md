# DirHash namespace factoring S-tier plan

- [ ] refactor(fs): namespace DirHash contract surface

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
- do not refactor `m.Pkg` namespace shape beyond required downstream type references;
- do not introduce new hashing primitives or bypass `@sys/crypto` / `@sys/fs` surfaces.

## XHIGH review result

The previous `m.Dir.Hash/t.ts` surface was pre-canon flat:

- `DirHashLib`
- `DirHashComputeOptions`
- `DirHashComputeProgressEvent`
- `DirHash`
- `DirHashVerifyResponse`

The correct cut is a clean public namespace contract with `DirHash.Lib` first and operation-specific contracts nested under `DirHash.Compute` and `DirHash.Verify`.

Correctness findings:

- `DirHash.verify` does not truthfully accept a raw hash string. String input is treated as a path to a JSON file containing `{ hash }`. The modern type exposes `DirHash.Verify.Input = t.CompositeHash | t.StringPath`.
- `DirHash.compute` emits progress for hashed files after filtering. The event `path` is relative to the hashed directory, so `t.StringRelativePath` is more truthful than generic `t.StringPath`.
- `DirHash.Result` should be a strict output shape with readonly fields. Implementation files should accumulate local values and return once instead of mutating objects typed as public outputs.
- Runtime modules should route types through `import { type t } from './common.ts'`, not direct imports from `./t.ts`.
- Deprecated flat aliases are intentionally not retained; external downstream callers should migrate to the namespace-first names.

## Target type shape

```ts
import type { t } from './common.ts';

/**
 * Directory hashing contracts.
 */
export declare namespace DirHash {
  /** Directory hashing helper library. */
  export type Lib = {
    readonly Fmt: t.HashFmtLib;
    readonly compute: Compute.Method;
    readonly verify: Verify.Method;
  };

  /** Result from hashing a directory. */
  export type Result = {
    readonly hash: t.CompositeHash;
    readonly dir: t.StringDir;
    readonly exists: boolean;
    readonly error?: t.StdError;
  };

  /**
   * Directory hash computation contracts.
   */
  export namespace Compute {
    export type Method = (
      dir: t.StringDir,
      options?: Options | t.Fs.Path.Filter,
    ) => Promise<DirHash.Result>;

    export type Options = {
      filter?: t.Fs.Path.Filter;
      onProgress?: (e: ProgressEvent) => t.Awaitable<void>;
    };

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
    export type Method = (dir: t.StringDir, input: Input) => Promise<Response>;
    export type Input = t.CompositeHash | t.StringPath;
    export type Response = DirHash.Result & {
      readonly is: t.HashVerifyResponse['is'];
    };
  }
}
```

## Implementation notes

- `m.Dir.Hash/m.DirHash.ts` exports `DirHash: t.DirHash.Lib`.
- `u.compute.ts` exports `compute: t.DirHash.Compute.Method` and removes the unused `Hash` import.
- `u.verify.ts` exports `verify: t.DirHash.Verify.Method` and documents string input as a hash-file path.
- `m.Dir/t.ts` points `Hash` at `t.DirHash.Lib`.
- `m.Pkg` call sites use `t.DirHash.Compute.ProgressEvent` and `t.DirHash.Verify.Input` where they forward DirHash contracts.
- Touched tests avoid direct `Deno.writeTextFile` and raw `JSON.stringify` in `m.Dir.Hash`.

## Search checks

Old flat type names should disappear from implementation and tests:

```sh
rg -n --glob '!**/-agent/**' "\b(DirHashLib|DirHashComputeOptions|DirHashComputeProgressEvent|DirHashVerifyResponse)\b" /Users/phil/code/org.sys/sys/code/sys/fs/src
```

Expected: no hits.

Standalone old `t.DirHash` result typing should disappear from implementation and tests:

```sh
rg -n --glob '!**/-agent/**' "\bt\.DirHash\b" /Users/phil/code/org.sys/sys/code/sys/fs/src
```

Expected: only namespace-qualified forms such as `t.DirHash.Lib`, `t.DirHash.Result`, `t.DirHash.Compute.*`, or `t.DirHash.Verify.*`.

Direct type imports from `m.Dir.Hash/t.ts` should disappear:

```sh
rg -n --glob '!**/-agent/**' "from './t\.ts'|from \"./t\.ts\"" /Users/phil/code/org.sys/sys/code/sys/fs/src/m.Dir.Hash
```

Expected: no hits.

Direct filesystem/JSON runtime bypass in touched `m.Dir.Hash` tests should disappear:

```sh
rg -n --glob '!**/-agent/**' "Deno\.writeTextFile|JSON\.stringify|as any" /Users/phil/code/org.sys/sys/code/sys/fs/src/m.Dir.Hash
```

Expected: no hits.

## Proof plan

From `/Users/phil/code/org.sys/sys/code/sys/fs`:

```sh
deno task check
```

```sh
deno task test --trace-leaks ./src/m.Dir.Hash ./src/m.Dir ./src/m.Pkg
```

```sh
deno task test
```

## Completion proof

Completed proof runs:

- `deno task check`
- `deno task test --trace-leaks ./src/m.Dir.Hash ./src/m.Dir ./src/m.Pkg`
- `deno task test`

## S-tier residue pass

Before closing:

- `src/m.Dir.Hash/t.ts` is type-plane pure and imports no runtime modules.
- `DirHash.Lib` is first in the root namespace.
- Verify input docs and types match runtime behavior: composite hash object or path to JSON containing `{ hash }`.
- Progress event docs and types match runtime behavior: event path is relative to the hashed directory.
- Runtime values remain stable: `DirHash`, `Dir.Hash`, `Dir.Hash.Fmt`, `compute`, and `verify` are unchanged at the value surface.
- Runtime implementations are typed through `import { type t } from './common.ts'`, not direct imports from `./t.ts`.
- No stale flat type references remain outside `-agent` notes.
- Touched public output objects are not mutated through readonly public result types.
- Existing behavior assertions are not churned unnecessarily.

## Remaining risk

External type consumers using old flat aliases must migrate:

```ts
t.DirHashLib → t.DirHash.Lib
t.DirHashComputeOptions → t.DirHash.Compute.Options
t.DirHashComputeProgressEvent → t.DirHash.Compute.ProgressEvent
t.DirHashVerifyResponse → t.DirHash.Verify.Response
t.DirHash → t.DirHash.Result
```

For verify string input semantics, migrate from raw hash-string typing to either:

```ts
t.DirHash.Verify.Input
```

or explicitly:

```ts
t.StringPath | t.CompositeHash
```
