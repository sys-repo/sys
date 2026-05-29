# Env namespace factoring STIER plan

- [ ] refactor(fs): namespace Env contract surface

## Scope

Package: `@sys/fs`.

Primary target:

- `code/sys/fs/src/m.Env/t.ts`

Expected adjacent updates:

- `code/sys/fs/src/m.Env/m.Env.ts`
- `code/sys/fs/src/m.Env/m.Is.ts`
- `code/sys/fs/src/m.Env/u.load.ts`
- `code/sys/fs/src/m.Env/u.init.ts`

Non-goals:

- do not change dotenv lookup behavior;
- do not change process-env fallback behavior;
- do not change VSCode detection semantics;
- do not restructure old `m.Env/-.test.ts` test placement in this pass.

## XHIGH review position

The current `m.Env` type surface is pre-canon:

- `t.ts` exposes flat prefixed aliases instead of a namespace contract:
  - `EnvLib`
  - `EnvLoadOptions`
  - `EnvLoadSearch`
  - `Env`
  - `EnvIsLib`

The correct cut is a clean public namespace contract with `Env.Lib` first, subordinate types under
`Env.*`, and an earned `Env.Load` sub-namespace for the load concept's multiple support types. This
is a factoring/contract refactor only; dotenv lookup, process fallback, direct dotenv import locality,
file naming, and VSCode detection behavior must remain equivalent.

## Target type shape

```ts
import { type t } from './common.ts';

/**
 * Helpers for retrieving environment variables (aka. "secrets").
 */
export declare namespace Env {
  /** Environment helper library. */
  export type Lib = {
    readonly Is: Is.Lib;
    readonly load: Load.Method;
    readonly init: (options?: InitOptions) => Promise<void>;
  };

  /** Reads env-vars from loaded dotenv values or the running process. */
  export type Reader = {
    /** Resolve an env var value. Missing keys resolve to an empty string for backwards compatibility. */
    readonly get: (key: string) => string;

    /** True when the key exists in loaded dotenv values or process env, including present-empty values. */
    readonly has: (key: string) => boolean;
  };

  /** Options for environment initialization. */
  export type InitOptions = {
    /** Suppress console output. */
    silent?: boolean;
  };

  /**
   * Dotenv loading contracts.
   */
  export namespace Load {
    /** Creates a reader for accessing env-vars. */
    export type Method = (options?: Options) => Promise<Reader>;

    /** Options for loading `.env` values. */
    export type Options = {
      /** Base directory for loading `.env` files (defaults to current working directory). */
      cwd?: t.StringDir;

      /** `.env` file lookup strategy. */
      search?: Search;
    };

    /** `.env` file lookup strategy. */
    export type Search = 'cwd' | 'upward';
  }

  /**
   * Boolean evaluators for environment conditions.
   */
  export namespace Is {
    /** Environment predicate library. */
    export type Lib = {
      readonly vscode: boolean;
    };
  }
}
```

## Namespace factoring decisions

- `Env.Lib` is the root runtime contract and must appear first.
- `Env.Reader` is preferred over `Env.Instance` because the returned object's role is reading
  environment values; `Instance` is a generic fallback when no better noun exists.
- `Env.Load.Method`, `Env.Load.Options`, and `Env.Load.Search` roll up the load concept because the
  method, lookup strategy, and load options are one concept with multiple support types.
- `Env.InitOptions` stays at the root because init currently owns only one public support type; do not
  add an `Env.Init` sub-namespace until the concept has more shape than a single options bag.
- `Env.Is.Lib` matches the runtime `Env.Is` sub-surface and follows the `<Sub>.Lib` convention.
- Input option shapes intentionally avoid `readonly`; canon treats inputs as requirements, not output
  promises.
- Keep the existing `m.Env.ts` runtime implementation filename; this pass is a type-surface refactor,
  not a file-layout migration.
- Do not create compatibility aliases unless the human explicitly chooses a compatibility release.

## Compatibility decision

The old flat `export type Env = ...` cannot coexist with `export declare namespace Env`; the canonical
namespace owns that name. Partial aliases such as `EnvLib = Env.Lib` would not save old `t.Env`
reader consumers, so they would add residue without preserving the full old surface.

Recommended STIER move: make the canonical namespace cut cleanly and migrate internal references to
`t.Env.*` in the same commit.

## Implementation steps

1. Refactor `src/m.Env/t.ts` to `export declare namespace Env` with `Lib` first.
2. Promote the returned reader type to `Env.Reader`.
3. Move load contracts under `Env.Load.Method`, `Env.Load.Options`, and `Env.Load.Search`.
4. Promote inline init options to root `Env.InitOptions`.
5. Move predicate library contract to `Env.Is.Lib`.
6. Update runtime call sites:
   - `m.Env.ts`: import `type { t }` from `./common.ts`; type the export as `t.Env.Lib`.
   - `m.Is.ts`: type `Is` as `t.Env.Is.Lib`.
   - `u.load.ts`: type `load` as `t.Env.Lib['load']`; type returned api as `t.Env.Reader`.
   - `u.init.ts`: type `init` as `t.Env.Lib['init']`.
7. Keep existing runtime dependency locality intact:
   - leave the direct `import * as DotEnv from '@std/dotenv';` in `u.load.ts`;
   - do not add a package-wide `DotEnv` export to `common/libs.ts`;
   - leave the local `hasOwn` helper in place unless a separate helper cleanup is explicitly requested.
8. Keep behavior tests unchanged unless a proof run exposes a contract mismatch.
9. Search for stale flat references: `EnvLib`, `EnvLoadOptions`, `EnvLoadSearch`, `EnvIsLib`, and
   `t.Env` used as a reader type.

## Search checks

Use content search only to locate residue; inspect any unexpected hit with `read` before editing.

```sh
rg -n "\bEnv(?:Lib|LoadOptions|LoadSearch|IsLib)\b|\bt\.Env\b" /Users/phil/code/org.sys/sys/code/sys/fs/src
```

Expected remaining `t.Env` hits after the refactor should be qualified namespace references such as
`t.Env.Lib`, `t.Env.Reader`, and `t.Env.Is.Lib`.

## Proof plan

From `/Users/phil/code/org.sys/sys/code/sys/fs`:

```sh
deno task check
```

```sh
deno task test --trace-leaks src/m.Env
```

If those are clean and the change is about to close, run the full package test:

```sh
deno task test
```

## STIER residue pass

Before calling complete:

- `src/m.Env/t.ts` is type-plane pure and has no runtime imports.
- `Env.Lib` is first in the public namespace.
- `Env.Load` owns `Method`, `Options`, and `Search`; no other sub-namespace is introduced without a
  multi-type concept.
- `Env.Load.Options` and `Env.InitOptions` do not mark input fields `readonly`.
- `src/m.Env/m.Env.ts` remains the primary runtime implementation file.
- No direct type imports from `./t.ts` remain in `m.Env` runtime files.
- No stale flat type names remain in `src/m.Env` or `src/types.ts` output.
- No package-wide `DotEnv` common export is introduced for this local dotenv implementation detail.
- Runtime behavior tests remain unchanged and green.
- Public docs/comments still describe the actual substrate: dotenv files plus process env fallback,
  with missing keys returning `''` for backwards compatibility.

## TMIND failure review

- **Cosmetic rename risk:** moving flat names into a namespace without updating runtime annotations would
  preserve the old disorder. Require all call sites to use `t.Env.*`.
- **Filename creep risk:** renaming `m.Env.ts` to `mod.Env.ts` would turn a type-surface refactor into a
  file-layout migration. Keep the existing local naming unless separately requested.
- **Input contract risk:** marking options as `readonly` would violate the input-permissive rule. Keep
  input option fields mutable in the type contract.
- **Over-factoring risk:** creating `Env.Init.Options` for one options type adds hierarchy without a
  concept group. Keep `Env.InitOptions` until init earns more shape.
- **Compatibility residue risk:** deprecated flat aliases would be incomplete because old `t.Env`
  cannot be preserved. Prefer a clean cut.
- **Import-surface creep risk:** promoting `@std/dotenv` into package common widens the package-local
  helper surface for no type-rename benefit. Keep the direct local import.
