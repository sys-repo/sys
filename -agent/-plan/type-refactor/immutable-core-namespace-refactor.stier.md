# @sys/immutable core namespace refactor

- [x] fddaf1d36 refactor(immutable): align core type surfaces with namespace spine
- [ ] plan(update): immutable core final reality
- [ ] docs(type-refactor): retire spent immutable core plan after namespace refactor

## Final reality

Implementation landed in `fddaf1d36`.

Actual changes:

- `ImmutableIsLib` moved to `ImmutableCore.Is.Lib`.
- `AsReadonly` moved to `ImmutableCore.Readonly.As`.
- `UnwrapImmutable` moved to `ImmutableCore.ToObject.Unwrap`.
- `PathRefLib`, `PathRefArgs`, and flat `PathRef` moved to `PathRef.Lib`, `PathRef.Args`, and `PathRef.Instance`.
- `ImmutableLensLib` and flat `ImmutableLens` moved to `ImmutableLens.Lib` and `ImmutableLens.Instance`.
- In-scope callers under `m.core` and `m.rfc6902/t.ts` were migrated to canonical namespace names.
- No deprecated compatibility alias blocks were retained or added.
- Runtime values and package exports remained unchanged.

Verification passed:

- `git diff --check`
- `cd /Users/phil/code/org.sys/sys/code/sys/immutable && deno fmt --check ./src/m.core/m.Immutable/t.ts ./src/m.core/m.Immutable/m.Is.ts ./src/m.core/m.Immutable/u.asReadonly.ts ./src/m.core/m.Immutable/u.toObject.ts ./src/m.core/m.PathRef/t.ts ./src/m.core/m.PathRef/m.PathRef.ts ./src/m.core/m.PathRef/u.bind.ts ./src/m.core/m.Immutable.Lens/t.ts ./src/m.core/m.Immutable.Lens/m.Lens.ts ./src/m.core/m.Immutable.Lens/u.make.ts ./src/m.rfc6902/t.ts`
- `cd /Users/phil/code/org.sys/sys/code/sys/immutable && deno task check`
- `cd /Users/phil/code/org.sys/sys/code/sys/immutable && deno task test`
- Residue search for removed flat aliases and old direct generic references returned no hits.

Final review: SHIP.

Remaining risk: none found for the planned scope.

## Scope

Package: `@sys/immutable`.

Target core type surfaces:

- `code/sys/immutable/src/m.core/m.Immutable/t.ts`
- `code/sys/immutable/src/m.core/m.PathRef/t.ts`
- `code/sys/immutable/src/m.core/m.Immutable.Lens/t.ts`

Required in-scope caller migration:

- `code/sys/immutable/src/m.rfc6902/t.ts`

Runtime surfaces that must remain stable:

- `Is`, `Symbols`, `asReadonly`, `markProxy`, and `toObject` from `code/sys/immutable/src/m.core/m.Immutable/mod.ts`.
- `PathRef` from `code/sys/immutable/src/m.core/m.PathRef/mod.ts`.
- `Lens` from `code/sys/immutable/src/m.core/m.Immutable.Lens/mod.ts`.
- Package exports in `code/sys/immutable/deno.json`.

Non-goals:

- Do not change immutable mutation, event, lens, path-ref, readonly, or toObject behavior.
- Do not change runtime exports or package exports.
- Do not move runtime values into `t.ts` or `t.*.ts`.
- Do not refactor `m.rfc6902` to its own namespace spine in this pass; update only its core alias references.
- Do not create deprecated compatibility alias blocks.
- Do not modify foundational `@sys/types` immutable data shapes such as `t.Immutable`, `t.ImmutableRef`, `t.ImmutableReadonly`, or `t.ImmutableRefReadonly`.

## XHIGH refinement result

The probe direction is correct that the core immutable files still expose legacy flat type spines. One important refinement is required before implementation:

- Do not introduce a root `Immutable` namespace in `m.Immutable/t.ts`.
- `@sys/types` already exports a foundational `Immutable<T, P>` type alias, and the local `@sys/immutable` type pool re-exports `@sys/types` before local immutable types.
- A local `Immutable` namespace would risk duplicate/ambiguous star exports and cannot safely merge with a type alias.
- Use a collision-free module-surface namespace root: `ImmutableCore`.

Modern comparison reference read for this plan:

- `code/sys/fs/src/m.FileMap/t.ts` — namespace-first surface with `FileMap.Lib` first, earned sub-namespaces, and type-plane-only declarations.

The implementation is rejected unless all `t.ts` / `t.*.ts` files remain type-plane pure: type-only imports, `export declare namespace`, `export type`, and non-exported helper types only.

## Current legacy flat names

`code/sys/immutable/src/m.core/m.Immutable/t.ts` currently exposes:

- `ImmutableIsLib`
- `UnwrapImmutable`
- `AsReadonly`

`code/sys/immutable/src/m.core/m.PathRef/t.ts` currently exposes:

- `PathRefLib`
- `PathRefArgs`
- `PathRef`

`code/sys/immutable/src/m.core/m.Immutable.Lens/t.ts` currently exposes:

- `ImmutableLensLib`
- `ImmutableLens`

Current in-repo callers found before implementation:

- `code/sys/immutable/src/m.core/m.Immutable/m.Is.ts`
- `code/sys/immutable/src/m.core/m.Immutable/u.asReadonly.ts`
- `code/sys/immutable/src/m.core/m.Immutable/u.toObject.ts`
- `code/sys/immutable/src/m.core/m.PathRef/m.PathRef.ts`
- `code/sys/immutable/src/m.core/m.PathRef/u.bind.ts`
- `code/sys/immutable/src/m.core/m.Immutable.Lens/m.Lens.ts`
- `code/sys/immutable/src/m.core/m.Immutable.Lens/u.make.ts`
- `code/sys/immutable/src/m.rfc6902/t.ts`

No exact live caller evidence requires retaining flat aliases.

## Target namespace shape

### `m.Immutable/t.ts`

Use `ImmutableCore` instead of `Immutable` to avoid colliding with `@sys/types`' foundational `Immutable<T, P>` type alias.

```ts
import type { t } from './common.ts';

type O = Record<string, unknown>;

export type * from './t.internal.ts';

/**
 * Type contracts for the core immutable module surface.
 */
export declare namespace ImmutableCore {
  /** Core immutable helper module surface. */
  export type Lib = {
    readonly Is: Is.Lib;
    asReadonly<T>(input: T): Readonly.As<T>;
    toObject<T extends O = O>(input?: T): ToObject.Unwrap<T>;
  };

  /**
   * Immutable Flags (type guards).
   */
  export namespace Is {
    /** Immutable predicate helper library. */
    export type Lib = {
      readonly objectPath: t.Is.Lib['objectPath'];
      proxy<T extends O>(input: any): input is T;

      immutable<D, P = unknown>(input: any): input is t.Immutable<D, P>;
      immutableRef<D, P = unknown, E = unknown>(input: any): input is t.ImmutableRef<D, P, E>;

      readonlyImmutable<T>(input: unknown): input is t.ImmutableReadonly<T>;
      readonlyImmutableRef<D, P = unknown, E = unknown>(
        input: unknown,
      ): input is t.ImmutableRefReadonly<D, P, E>;
    };
  }

  /**
   * Type contracts for `toObject`.
   */
  export namespace ToObject {
    /**
     * Type delegate for `toObject`.
     * Currently identity; reserved for detaching branded/proxy shapes in future.
     */
    export type Unwrap<T> = T;
  }

  /**
   * Readonly immutable conversion contracts.
   */
  export namespace Readonly {
    /**
     * Maps any immutable or ref handle (mutable or readonly)
     * into its canonical readonly reference shape.
     */
    export type As<T> =
      T extends t.ImmutableRef<infer A, infer P, infer E>
        ? t.ImmutableRefReadonly<A, P, E>
        : T extends t.ImmutableRefReadonly<infer A, infer P, infer E>
          ? t.ImmutableRefReadonly<A, P, E>
          : T extends t.Immutable<infer A, infer P>
            ? t.ImmutableRefReadonly<A, P, t.ImmutableEvents<A, P>>
            : T extends t.ImmutableReadonly<infer A>
              ? t.ImmutableRefReadonly<A, unknown, t.ImmutableEvents<A, unknown>>
              : never;
  }
}
```

No `ImmutableIsLib`, `UnwrapImmutable`, or `AsReadonly` aliases should remain.

### `m.PathRef/t.ts`

```ts
import type { t } from './common.ts';

type O = Record<string, unknown>;
type PathInput = t.ObjectPath | undefined | null;

/**
 * Path-bound projection of `ImmutableRef<T>` state.
 */
export declare namespace PathRef {
  /** PathRef helper library. */
  export type Lib = {
    bind<TRoot extends O, P = unknown, V = unknown>(
      args: Args<TRoot, P, V>,
    ): Instance<TRoot, P, V>;
  };

  /** Factory args for a path-bound reference projection. */
  export type Args<TRoot extends O, P = unknown, V = unknown> = {
    readonly root: t.ImmutableRef<TRoot, P, t.ImmutableEvents<TRoot, P>>;
    readonly path: PathInput;
    readonly initial?: () => V;
  };

  /** Path-bound projection of a root immutable reference. */
  export type Instance<TRoot extends O = O, P = unknown, V = unknown> = {
    readonly root: t.ImmutableRef<TRoot, P, t.ImmutableEvents<TRoot, P>>;
    readonly path: t.ObjectPath;
    readonly current: V;
    change(mutator: (draft: V) => void): void;
    events(until?: t.UntilInput): { readonly $: t.Observable<{ readonly after: V }> };
  };
}
```

No `PathRefLib`, `PathRefArgs`, or flat `PathRef` type alias should remain. Runtime value `PathRef` remains unchanged.

### `m.Immutable.Lens/t.ts`

Keep `ImmutableLens` as the type namespace root rather than bare `Lens` to preserve the current domain name and avoid exporting a generic package-wide `t.Lens` noun. Runtime value `Lens` remains unchanged.

```ts
import type { t } from './common.ts';

type PathInput = t.ObjectPath | undefined | null;

/**
 * Path-based lens helpers for working with a generic Immutable<T> structure.
 */
export declare namespace ImmutableLens {
  /** Immutable lens helper library. */
  export type Lib = {
    at<V = unknown, T = unknown, P = unknown>(
      doc: t.Immutable<T, P>,
      ...path: PathInput[]
    ): Instance<T, P, V>;
  };

  /**
   * Lens instance bound to an Immutable<T> and ObjectPath.
   */
  export type Instance<T = unknown, P = unknown, V = unknown> = {
    readonly doc: t.Immutable<T, P>;
    readonly path: t.ObjectPath;
    get(): V | undefined;
    getOr<D extends t.NonUndefined<V>>(def: D): V | D;
    exists(): boolean;
    set(value: V): void;
    update(map: (curr: V | undefined) => V): void;
    ensure<D extends t.NonUndefined<V>>(def: D): V | D;
    delete(): void;
    child<U = unknown>(sub: PathInput): Instance<T, P, U>;
    as<U>(): Instance<T, P, U>;
    at<U = unknown>(...segments: PathInput[]): Instance<T, P, U>;
  };
}
```

No `ImmutableLensLib` or flat `ImmutableLens` type alias should remain. Runtime value `Lens` remains unchanged.

## Legacy alias disposition

Remove flat aliases rather than preserving or adding deprecated alias blocks.

Alias retention is not justified by current caller evidence because all in-repo callers are in the same package and can be migrated to canonical namespace names in this refactor.

If implementation discovers a live caller that cannot be migrated without changing runtime behavior or public package exports, HOLD and report the exact caller instead of adding a compatibility alias.

## Source files expected to change

### Type spines

- `code/sys/immutable/src/m.core/m.Immutable/t.ts`
  - Replace `ImmutableIsLib`, `UnwrapImmutable`, and `AsReadonly` with `ImmutableCore.Lib`, `ImmutableCore.Is.Lib`, `ImmutableCore.ToObject.Unwrap`, and `ImmutableCore.Readonly.As`.
  - Preserve `export type * from './t.internal.ts'`.
  - Do not introduce `export namespace Immutable`.

- `code/sys/immutable/src/m.core/m.PathRef/t.ts`
  - Replace `PathRefLib`, `PathRefArgs`, and flat `PathRef` type alias with `PathRef.Lib`, `PathRef.Args`, and `PathRef.Instance`.

- `code/sys/immutable/src/m.core/m.Immutable.Lens/t.ts`
  - Replace `ImmutableLensLib` and flat `ImmutableLens` type alias with `ImmutableLens.Lib` and `ImmutableLens.Instance`.

### Core implementation/reference lanes

- `code/sys/immutable/src/m.core/m.Immutable/m.Is.ts`
  - `t.ImmutableIsLib` -> `t.ImmutableCore.Is.Lib`.

- `code/sys/immutable/src/m.core/m.Immutable/u.asReadonly.ts`
  - `t.AsReadonly<T>` -> `t.ImmutableCore.Readonly.As<T>`.

- `code/sys/immutable/src/m.core/m.Immutable/u.toObject.ts`
  - `t.UnwrapImmutable<T>` -> `t.ImmutableCore.ToObject.Unwrap<T>`.

- `code/sys/immutable/src/m.core/m.PathRef/m.PathRef.ts`
  - `t.PathRefLib` -> `t.PathRef.Lib`.

- `code/sys/immutable/src/m.core/m.PathRef/u.bind.ts`
  - `t.PathRefLib['bind']` -> `t.PathRef.Lib['bind']`.
  - `t.PathRef<any, any, any>` -> `t.PathRef.Instance<any, any, any>`.

- `code/sys/immutable/src/m.core/m.Immutable.Lens/m.Lens.ts`
  - `t.ImmutableLensLib` -> `t.ImmutableLens.Lib`.

- `code/sys/immutable/src/m.core/m.Immutable.Lens/u.make.ts`
  - `t.ImmutableLens<T, P, V>` -> `t.ImmutableLens.Instance<T, P, V>`.

### In-scope non-core caller migration

- `code/sys/immutable/src/m.rfc6902/t.ts`
  - `t.ImmutableIsLib` -> `t.ImmutableCore.Is.Lib`.
  - `t.ImmutableLensLib` -> `t.ImmutableLens.Lib`.
  - `t.AsReadonly<T>` -> `t.ImmutableCore.Readonly.As<T>`.
  - `t.UnwrapImmutable<T>` -> `t.ImmutableCore.ToObject.Unwrap<T>`.
  - Do not refactor `ImmutableRfc6902Lib` or RFC6902 subtypes in this pass.

## Expected unchanged files

- `code/sys/immutable/src/m.core/m.Immutable/mod.ts`
- `code/sys/immutable/src/m.core/m.PathRef/mod.ts`
- `code/sys/immutable/src/m.core/m.Immutable.Lens/mod.ts`
- `code/sys/immutable/src/m.core/mod.ts`
- `code/sys/immutable/src/mod.ts`
- `code/sys/immutable/src/types.ts`, unless `deno task check` proves an explicit type-only export is needed to resolve a type-pool ambiguity.
- `code/sys/immutable/src/common/t.ts`, unless `deno task check` proves an explicit type-only export is needed to resolve a type-pool ambiguity.
- `code/sys/immutable/deno.json`

## Implementation sequence

1. Refactor `m.Immutable/t.ts` to the `ImmutableCore` namespace shape and remove flat core aliases.
2. Update `m.Immutable` implementation references to `t.ImmutableCore.*`.
3. Refactor `m.PathRef/t.ts` to `PathRef.Lib`, `PathRef.Args`, and `PathRef.Instance`.
4. Update `m.PathRef` implementation references to canonical `t.PathRef.*` names.
5. Refactor `m.Immutable.Lens/t.ts` to `ImmutableLens.Lib` and `ImmutableLens.Instance`.
6. Update lens implementation references to canonical `t.ImmutableLens.*` names.
7. Update only the core alias references in `m.rfc6902/t.ts`.
8. Run residue search for removed legacy flat names.
9. Run nearest module verification commands.

## HOLD conditions

HOLD and ask before continuing if any of these occur:

- TypeScript reports a type-pool conflict involving `ImmutableCore`, `PathRef`, or `ImmutableLens` that would require changing package exports or introducing flat aliases.
- Any current in-repo caller cannot be migrated to canonical namespace names in this change.
- The refactor appears to require changing runtime exports, package exports, mutation behavior, event behavior, lens behavior, path-ref behavior, readonly conversion behavior, or toObject behavior.
- The implementation would require adding deprecated compatibility alias blocks.
- The implementation appears to require declaring `export namespace Immutable` or altering foundational `@sys/types` immutable types.
- Refactoring `m.rfc6902` beyond the core alias references becomes necessary.

## Verification

Run from the nearest module task surface:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/immutable && deno fmt --check ./src/m.core/m.Immutable/t.ts ./src/m.core/m.Immutable/m.Is.ts ./src/m.core/m.Immutable/u.asReadonly.ts ./src/m.core/m.Immutable/u.toObject.ts ./src/m.core/m.PathRef/t.ts ./src/m.core/m.PathRef/m.PathRef.ts ./src/m.core/m.PathRef/u.bind.ts ./src/m.core/m.Immutable.Lens/t.ts ./src/m.core/m.Immutable.Lens/m.Lens.ts ./src/m.core/m.Immutable.Lens/u.make.ts ./src/m.rfc6902/t.ts
cd /Users/phil/code/org.sys/sys/code/sys/immutable && deno task check
cd /Users/phil/code/org.sys/sys/code/sys/immutable && deno task test
```

Residue search after edits:

```sh
rg -n "\\b(ImmutableIsLib|UnwrapImmutable|AsReadonly|PathRefLib|PathRefArgs|ImmutableLensLib)\\b|t\\.PathRef<|type PathRef<|t\\.ImmutableLens<|type ImmutableLens<" /Users/phil/code/org.sys/sys/code/sys/immutable/src
```

Expected residue after implementation:

- none for removed flat alias names or old direct flat generic references;
- runtime value names such as `PathRef` and `Lens` may remain and are not alias residue.
