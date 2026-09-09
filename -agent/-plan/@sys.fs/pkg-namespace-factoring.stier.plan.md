pkg-namespace-factoring.stier.plan.md
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

Package: `@sys/fs`.

Primary target:

- `code/sys/fs/src/m.Pkg/t.ts`

Required adjacent updates:

- `code/sys/fs/src/common/t.ts`
- `code/sys/fs/src/m.Pkg/m.Pkg.ts`
- `code/sys/fs/src/m.Pkg/m.Pkg.Dist.ts`
- `code/sys/fs/src/m.Pkg/m.Log.ts`
- `code/sys/fs/src/m.Pkg/u/u.log.children.ts`
- `code/sys/fs/src/m.Pkg/u/u.log.dist.ts`

Expected unchanged unless proof reveals stale docs or exports:

- `code/sys/fs/src/m.Pkg/mod.ts`
- `code/sys/fs/src/types.ts`

Non-goals:

- do not change `Pkg` or `Dist` runtime export names;
- do not change distribution hash policy semantics;
- do not change canonical/legacy `dist.json` load classification;
- do not change `trustChildDist` behavior;
- do not restructure tests or fixtures in this pass;
- do not refactor `@sys/std/pkg` in this pass.

## XHIGH review result

The current `m.Pkg/t.ts` surface is pre-canon flat:

- `PkgFsLib`
- `PkgDistFsLib`
- `PkgDistLog`
- `PkgDistComputeArgs`
- `PkgDistComputeResponse`
- `PkgDistLoadResponse`
- `PkgDistVerifyResponse`

This violates the modern contract shape because the runtime noun is already `Pkg`, but the filesystem-extended type contract is spread across prefixed aliases. The correct cut is a clean public namespace contract with `Pkg.Lib` first and the filesystem distribution helpers nested under `Pkg.Dist.*`.

Important type-pool finding:

- `src/common/t.ts` currently explicitly exports `Pkg` from `@sys/std/t`.
- If that stays unchanged, `import { type t } from './common.ts'` inside `@sys/fs` will keep resolving `t.Pkg` to the std package namespace, not the filesystem-extended namespace.
- Therefore this refactor must promote the local `@sys/fs` `Pkg` type/namespace through `src/types.ts` and make `src/common/t.ts` explicitly export that local `Pkg` instead of the std one.

Search evidence before this plan:

```sh
rg -n "\bPkg(?:FsLib|DistFsLib|DistLog|DistComputeArgs|DistComputeResponse|DistLoadResponse|DistVerifyResponse)\b|\bt\.PkgDist" code/sys code/-tmpl
```

Only `code/sys/fs/src/m.Pkg` uses the flat fs package aliases. Broader `@sys/std/pkg` flat `PkgDist*` names are out of scope for this pass.

## Target type shape

Use the same root type plus same-named namespace pattern as modern @sys modules.

```ts
import type { Pkg as StdPkg } from '@sys/std/t';
import type { t } from './common.ts';

export type Pkg = StdPkg;

/**
 * Filesystem-extended package metadata helper contracts.
 */
export declare namespace Pkg {
  /** Filesystem-extended package metadata helper library. */
  export type Lib = StdPkg.Lib & {
    /** Tools for working with distribution packages on the filesystem. */
    readonly Dist: Dist.Lib;
  };

  /**
   * Distribution package filesystem contracts.
   */
  export namespace Dist {
    /** Filesystem helpers for distribution-package metadata. */
    export type Lib = StdPkg.Dist.Lib & {
      /** Load a `dist.json` file. */
      load: Load.Method;

      /** Compute distribution-package metadata. */
      compute: Compute.Method;

      /** Verify a folder against distribution-package hash definitions. */
      verify: Verify.Method;

      /** Logging helpers for distribution-package metadata. */
      readonly Log: Log.Lib;
    };

    /**
     * Distribution-package logging contracts.
     */
    export namespace Log {
      /** Logging helper library. */
      export type Lib = {
        /** Convert a `DistPkg` to a string for logging. */
        dist(dist?: t.DistPkg, options?: Options): string;

        /** Render child distribution packages for logging. */
        children(dir: t.StringDir, dist: t.DistPkg): Promise<string>;
      };

      /** Options for distribution-package log rendering. */
      export type Options = {
        title?: string | false;
        dir?: t.StringDir;
        indent?: number;
      };
    }

    /**
     * Distribution-package compute contracts.
     */
    export namespace Compute {
      /** Compute distribution-package metadata. */
      export type Method = (args: Args) => Promise<Response>;

      /** Arguments passed to `Pkg.Dist.compute`. */
      export type Args = {
        dir: t.StringPath;
        pkg?: StdPkg;
        builder?: StdPkg;
        ignore?: string | string[];
        save?: boolean;
        filter?(path: t.StringPath): boolean;
        onHashProgress?(e: t.DirHashComputeProgressEvent): void | Promise<void>;

        /** Reuse child `dist.hash.parts` to avoid re-hashing nested bundles. */
        trustChildDist?: boolean;
      };

      /** Response from `Pkg.Dist.compute`. */
      export type Response = {
        exists: boolean;
        dir: t.StringDir;
        dist: t.DistPkg;
        error?: t.StdError;
      };
    }

    /**
     * Distribution-package load contracts.
     */
    export namespace Load {
      /** Load a `dist.json` file. */
      export type Method = (dir: t.StringPath) => Promise<Response>;

      /** Classification of a loaded distribution-package file. */
      export type Kind = 'canonical' | 'legacy' | 'invalid' | 'missing';

      /** Response from `Pkg.Dist.load`. */
      export type Response = {
        exists: boolean;
        path: t.StringPath;
        kind: Kind;
        dist?: t.DistPkg;
        legacy?: t.DistPkgLegacy;
        error?: t.StdError;
      };
    }

    /**
     * Distribution-package verification contracts.
     */
    export namespace Verify {
      /** Verify a folder against distribution-package hash definitions. */
      export type Method = (
        dir: t.StringPath,
        hash?: t.StringHash | t.CompositeHash,
      ) => Promise<Response>;

      /** Response from `Pkg.Dist.verify`. */
      export type Response = {
        is: t.HashVerifyResponse['is'];
        exists: boolean;
        dist?: t.DistPkg;
        error?: t.StdError;
      };
    }
  }
}
```

## Namespace factoring decisions

- `Pkg.Lib` is the root runtime contract and must appear first.
- `Pkg` must remain a type alias for the standard package metadata value shape, matching `@sys/std/pkg`'s merged type/namespace pattern.
- `Pkg.Lib` extends `StdPkg.Lib`; do not write `t.Pkg.Lib` inside `m.Pkg/t.ts`, because after the refactor that would self-reference the filesystem namespace.
- `Pkg.Dist.Lib` extends `StdPkg.Dist.Lib`; the filesystem package augments the std distribution helpers, it does not replace them.
- `Pkg.Dist.Log` is earned because logging has a helper lib plus options.
- `Pkg.Dist.Compute` is earned because compute has a method, args, response, progress callback usage, and `trustChildDist` policy.
- `Pkg.Dist.Load` is earned because load has method, response, and kind classification.
- `Pkg.Dist.Verify` is earned because verify has method and response shapes.
- Do not introduce a generic `Options` or `Response` at `Pkg.Dist` root; operation-specific result shapes should stay under their operation namespace.

## Compatibility decision

Recommended S-tier move: make the namespace cut cleanly and do not keep flat aliases by default.

Rationale:

- The old flat aliases are not referenced outside `m.Pkg` in the checked monorepo paths.
- Keeping `PkgDist*` aliases after migrating internal code would be transitional residue.
- `@sys/fs` is still `0.0.x`, and this is a type-surface cleanup rather than a runtime behavior change.

Fallback only if the human requests a compatibility window or proof reveals downstream breakage:

```ts
/** @deprecated Use `Pkg.Lib`. */
export type PkgFsLib = Pkg.Lib;
/** @deprecated Use `Pkg.Dist.Lib`. */
export type PkgDistFsLib = Pkg.Dist.Lib;
/** @deprecated Use `Pkg.Dist.Log.Lib`. */
export type PkgDistLog = Pkg.Dist.Log.Lib;
/** @deprecated Use `Pkg.Dist.Compute.Args`. */
export type PkgDistComputeArgs = Pkg.Dist.Compute.Args;
/** @deprecated Use `Pkg.Dist.Compute.Response`. */
export type PkgDistComputeResponse = Pkg.Dist.Compute.Response;
/** @deprecated Use `Pkg.Dist.Load.Response`. */
export type PkgDistLoadResponse = Pkg.Dist.Load.Response;
/** @deprecated Use `Pkg.Dist.Verify.Response`. */
export type PkgDistVerifyResponse = Pkg.Dist.Verify.Response;
```

Do not add these aliases silently; choose them deliberately as compatibility, not canon.

## Implementation steps

1. Refactor `src/m.Pkg/t.ts` to export `type Pkg = StdPkg` plus `export declare namespace Pkg`.
2. Put `Pkg.Lib` first, then nest `Dist`, then put `Dist.Lib` first.
3. Move log, compute, load, and verify contracts under `Pkg.Dist.*` as shown above.
4. Update `src/common/t.ts` so the package type pool exposes the filesystem `Pkg` namespace:
   - remove `Pkg` from the `@sys/std/t` named export;
   - add an explicit `export type { Pkg } from '../types.ts';`.
5. Update runtime annotations to use the canonical local `t` lane:
   - `m.Pkg.ts`: import `type { t }` from `./common.ts`; type the export as `t.Pkg.Lib`.
   - `m.Pkg.Dist.ts`: remove direct type import from `./t.ts`; type `Dist` as `t.Pkg.Dist.Lib`.
   - `m.Pkg.Dist.ts`: migrate response refs to `t.Pkg.Dist.Compute.Response`, `t.Pkg.Dist.Load.Response`, and `t.Pkg.Dist.Verify.Response`.
   - `m.Pkg.Dist.ts`: migrate load kind to `t.Pkg.Dist.Load.Kind`.
   - `m.Log.ts`: type `Log` as `t.Pkg.Dist.Log.Lib`.
   - `u/u.log.children.ts`: type `children` as `t.Pkg.Dist.Log.Lib['children']`.
   - `u/u.log.dist.ts`: type `dist` as `t.Pkg.Dist.Log.Lib['dist']`.
6. During the touched-file pass, route normal JSON/filesystem saving through canonical package surfaces if behavior can be preserved:
   - prefer `Json` from `./common.ts` over raw `JSON.stringify`;
   - prefer `Fs.writeJson` or `Fs.write` over direct `Deno.writeTextFile`;
   - if using `Fs.writeJson`, explicitly throw returned write errors so the save path does not silently weaken current failure behavior.
7. Keep `mod.ts` unchanged unless proof reveals stale module docs or public export mismatch.
8. Run stale-name searches and remove all non-compat flat references.

## Search checks

Use content search only to locate residue; inspect unexpected hits with `read` before editing.

```sh
rg -n "\bPkg(?:FsLib|DistFsLib|DistLog|DistComputeArgs|DistComputeResponse|DistLoadResponse|DistVerifyResponse)\b|\bt\.PkgDist" code/sys/fs/src
```

Expected result after a clean cut: no hits.

If compatibility aliases are deliberately retained, expected remaining hits should be only the deprecated alias block in `src/m.Pkg/t.ts`.

Also verify the type-pool export did not keep the std `Pkg` shadow:

```sh
rg -n "export type \{[^}]*Pkg[^}]*\} from '@sys/std/t'|export type \{ Pkg \} from '../types.ts'" code/sys/fs/src/common/t.ts
```

Expected result: no std `Pkg` export, one local `Pkg` export.

## Proof plan

From `code/sys/fs`:

```sh
deno task check
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

- `src/m.Pkg/t.ts` is type-plane pure and imports no runtime modules.
- `Pkg.Lib` is first in the root namespace.
- `Pkg.Dist.Lib` is first in the `Pkg.Dist` namespace.
- Runtime implementations are typed through `import { type t } from './common.ts'`, not direct imports from `./t.ts`.
- No stale flat type references remain unless a deliberate deprecated compatibility block was chosen.
- `src/common/t.ts` exposes the local filesystem `Pkg` namespace, not the std namespace shadow.
- `Pkg.Dist.Lib` still extends the full std distribution helper surface.
- `Pkg.Lib` still extends the full std package helper surface.
- Runtime behavior for compute/load/verify/log remains unchanged.
- Save-path cleanup does not swallow write errors that currently reject.
- Test names and existing behavior assertions are not churned unnecessarily.

## TMIND failure review

- **Std shadow risk:** if `src/common/t.ts` continues exporting `Pkg` from `@sys/std/t`, `t.Pkg.Lib` in fs runtime code will not include fs-only `compute`, `load`, `verify`, or `Log`. Fix the type pool as part of the same refactor.
- **Recursive base risk:** inside `m.Pkg/t.ts`, extending `t.Pkg.Lib` after creating the local namespace can self-reference. Use `StdPkg.Lib` and `StdPkg.Dist.Lib` for base contracts.
- **Over-factoring risk:** introducing extra namespaces such as `Pkg.Dist.HashPolicy` would be speculative here. Only roll up concepts that already have multiple public types.
- **Compatibility residue risk:** deprecated flat aliases are easy but lower the finish quality unless there is an explicit compatibility reason. Default to clean cut.
- **Behavior drift risk:** replacing raw save code with `Fs.writeJson` must preserve error behavior. Throw returned write errors if the helper reports failure.
- **Scope creep risk:** `@sys/std/pkg` still has some flat `PkgDist*` support types. Do not widen this fs-local refactor into std unless separately requested.
