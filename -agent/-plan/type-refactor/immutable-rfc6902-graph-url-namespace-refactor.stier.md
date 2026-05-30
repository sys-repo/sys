# @sys/immutable rfc6902, graph, and url namespace refactor

- [x] f1f0d2b59 refactor(immutable): align leaf type surfaces with namespace spine
- [ ] plan(update): immutable leaf surfaces final reality
- [ ] docs(type-refactor): retire spent immutable leaf namespace plan after refactor

## Final reality

Implementation landed in `f1f0d2b59`.

- `ImmutableRfc6902Lib` moved to `ImmutableRfc6902.Lib`.
- `ImmutableRfc6902EventsLib` moved to `ImmutableRfc6902.Events.Lib`.
- `ImmutableRfc6902PatchLib` moved to `ImmutableRfc6902.Patch.Lib`, and `m.rfc6902/t.patch.ts` was removed after direct-import residue was clear.
- `GraphLib` moved to `Graph.Lib`; `Graph.Dag.Lib` was introduced for the DAG helper object.
- `ImmutableUrlLib`, `UrlRef`, `UrlRefReadonly`, `UrlPatch`, and `UrlDslRef` moved to `ImmutableUrl.*`.
- `@sys/ui-dom` URL callers were migrated to `ImmutableUrl.*` with no compatibility alias block.
- Existing `Graph.Node` and `Graph.Edge` aliases were intentionally retained because current downstream caller evidence exists in `code/sys.driver/driver-automerge/src/t.namespace.ts`.

Verification passed:

- `cd /Users/phil/code/org.sys/sys/code/sys/immutable && deno fmt --check ./src/m.rfc6902/t.ts ./src/m.rfc6902/m.Immutable.ts ./src/m.rfc6902/m.Events.ts ./src/m.rfc6902/m.Patch.ts ./src/m.graph/t.ts ./src/m.graph/m.Graph.ts ./src/m.graph/u.dag.ts ./src/m.url/t.ts ./src/m.url/m.Url.ts ./src/m.url/u.ref.ts ./src/m.url/u.dsl.ts ./src/m.url/-test/-u.dsl.test.ts`
- `cd /Users/phil/code/org.sys/sys/code/sys/immutable && deno task check`
- `cd /Users/phil/code/org.sys/sys/code/sys/immutable && deno task test`
- `cd /Users/phil/code/org.sys/sys/code/sys.ui/ui-dom && deno fmt --check ./src/common/t.ts ./src/m.Url/t.ts ./src/m.Url/u.bindToWindow.ts ./src/m.Url/-.test.ts`
- `cd /Users/phil/code/org.sys/sys/code/sys.ui/ui-dom && deno task check`
- `cd /Users/phil/code/org.sys/sys/code/sys.ui/ui-dom && deno task test ./src/m.Url`
- `git diff --check`
- removed flat-alias residue search over `code/sys/immutable/src` and `code/sys.ui/ui-dom/src`: no hits.

Remaining risk: none found for the planned scope.

## Scope

Package: `@sys/immutable`.

Target leaf type surfaces:

- `code/sys/immutable/src/m.rfc6902/t.ts`
- `code/sys/immutable/src/m.graph/t.ts`
- `code/sys/immutable/src/m.url/t.ts`

Required adjacent rfc6902 type file:

- `code/sys/immutable/src/m.rfc6902/t.patch.ts`

Required downstream caller lane for URL flat-alias removal:

- `code/sys.ui/ui-dom/src/common/t.ts`
- `code/sys.ui/ui-dom/src/m.Url/t.ts`
- `code/sys.ui/ui-dom/src/m.Url/u.bindToWindow.ts`
- `code/sys.ui/ui-dom/src/m.Url/-.test.ts`

Runtime surfaces that must remain stable:

- `Immutable` from `code/sys/immutable/src/m.rfc6902/mod.ts`.
- `Graph` from `code/sys/immutable/src/m.graph/mod.ts`.
- `Url` from `code/sys/immutable/src/m.url/mod.ts`.
- `Url` from `code/sys.ui/ui-dom/src/m.Url/mod.ts`.
- Package exports in `code/sys/immutable/deno.json` and `code/sys.ui/ui-dom/deno.json`.

Non-goals:

- Do not change RFC-6902 patch behavior, immutable event behavior, graph-walk behavior, DAG materialization, URL ref behavior, or DOM URL binding behavior.
- Do not change runtime exports or package exports.
- Do not move runtime values into `t.ts` or `t.*.ts`.
- Do not add deprecated compatibility alias blocks.
- Do not widen public type API by exporting helper types that are currently private implementation details.
- Do not remove existing `Graph.Node` / `Graph.Edge` convenience aliases in this pass unless the downstream `sys.driver` caller migration is explicitly added.

## XHIGH refinement result

The probe direction is valid: these are the remaining `@sys/immutable` leaf type surfaces with legacy flat `XxxLib` names after the core namespace refactor. Two refinements are required before implementation:

1. `m.rfc6902/t.patch.ts` is part of the rfc6902 type surface even though the initial target list named `t.ts`. It currently exports `ImmutableRfc6902PatchLib`, which is referenced by `m.rfc6902/t.ts` and `m.rfc6902/m.Patch.ts`. The clean refactor should fold this into `ImmutableRfc6902.Patch.Lib` and remove the stale flat patch alias.
2. `m.url/t.ts` has live downstream flat-type callers in `@sys/ui-dom`. To avoid retaining compatibility aliases, migrate those callers in the same implementation commit. If `@sys/ui-dom` cannot be included, HOLD the URL portion rather than manufacturing deprecated alias blocks.

Modern comparison reference read for this plan:

- `code/sys/crypto/src/m.Hash/t.ts` — namespace-first surface with `Hash.Lib` first, earned `Hash.Is.Lib` and `Hash.Shorten.*` sub-namespaces, type-only imports, and no flat compatibility alias block.

Reject the implementation if any `t.ts` / `t.*.ts` file gains runtime values, if package/runtime exports change, or if the change adds compatibility aliases without exact current caller proof.

## Current legacy flat names

`code/sys/immutable/src/m.rfc6902/t.ts` currently exposes:

- `ImmutableRfc6902Lib`
- `ImmutableRfc6902EventsLib`

`code/sys/immutable/src/m.rfc6902/t.patch.ts` currently exposes:

- `ImmutableRfc6902PatchLib`

`code/sys/immutable/src/m.graph/t.ts` currently exposes:

- `GraphLib`

`code/sys/immutable/src/m.url/t.ts` currently exposes:

- `ImmutableUrlLib`
- `UrlRef`
- `UrlRefReadonly`
- `UrlPatch`
- `UrlDslRef`

## Target namespace shape

### `m.rfc6902/t.ts`

Use `ImmutableRfc6902` as the root namespace and keep `Lib` first.

```ts
import type { t } from './common.ts';

type O = Record<string, unknown>;
type P = t.Rfc6902PatchOperation;
type DefaultPatch = P;

/**
 * Library: Immutable (RFC6902 Patch Standard)
 */
export declare namespace ImmutableRfc6902 {
  /** RFC-6902 immutable helper module surface. */
  export type Lib = {
    readonly Is: t.ImmutableCore.Is.Lib;
    readonly Events: Events.Lib;
    readonly Patch: Patch.Lib;
    readonly Lens: t.ImmutableLens.Lib;
    cloner: Cloner;
    clonerRef: ClonerRef;
    asReadonly<T>(input: T): t.ImmutableCore.Readonly.As<T>;
    toObject<T extends O = O>(input?: T): t.ImmutableCore.ToObject.Unwrap<T>;
  };

  /** Helpers for RFC-6902 events. */
  export namespace Events {
    export type Lib = {
      readonly viaOverride: EventsViaOverride;
      readonly viaObservable: EventsViaObservable;
      readonly pathFilter: PathEventsFactory;
    };
  }

  /** Helpers for working with RFC-6902 JSON patch pointers. */
  export namespace Patch {
    export type Lib = {
      toObjectPath(path: string): t.ObjectPath;
    };
  }
}
```

Keep `ClonerOptions`, `Cloner`, `ClonerRef`, `EventsViaOverride`, `EventsViaObservable`, and `PathEventsFactory` as non-exported helper types unless implementation evidence proves a current exported caller needs them. No such caller is currently known.

Remove `export type * from './t.patch.ts';` after folding `Patch.Lib` into `t.ts`.

### `m.graph/t.ts`

Use the existing `Graph` root namespace. Move the primary surface into `Graph.Lib` and keep it first.

```ts
export declare namespace Graph {
  /** Generic DAG walker helper module surface. */
  export type Lib = {
    readonly default: { readonly discoverRefs: DiscoverRefs };
    readonly walk: Walk;
    readonly Dag: Dag.Lib;
  };

  // Existing Graph.Walk, Graph.LoadDoc, Graph.WalkArgs, etc. remain.

  export namespace Dag {
    /** DAG helper module surface. */
    export type Lib = {
      readonly build: Build;
      readonly index: Index;
      readonly forEach: ForEachSync;
      readonly forEachAsync: ForEachAsync;
    };

    // Existing Graph.Dag.Node, Edge, Result, BuildArgs, Build, etc. remain.
  }
}
```

Preserve existing `Graph.Walk`, `Graph.LoadDoc`, `Graph.WalkArgs`, `Graph.WalkResult`, and `Graph.Dag.*` names. These are already namespace-shaped and have broad in-repo callers.

Existing `Graph.Node` and `Graph.Edge` are namespace aliases to `Graph.Dag.Node` and `Graph.Dag.Edge`. They are not new flat `XxxLib` aliases. Retain them in this pass because exact current caller evidence exists in `code/sys.driver/driver-automerge/src/t.namespace.ts`. If alias removal is required, split that into a follow-up compatibility-alias pass or explicitly add the driver migration to this scope.

### `m.url/t.ts`

Use `ImmutableUrl` as the root namespace. Do not use `Url` as the root namespace because the immutable type pool already imports `Url` from `@sys/std/t` for the standard URL helper namespace.

```ts
import type { t } from './common.ts';

/**
 * Immutable URL helpers layered on top of the standard URL helpers.
 */
export declare namespace ImmutableUrl {
  /** Immutable URL helper module surface. */
  export type Lib = t.Url.Lib & {
    ref(init: Input): Ref;
    dsl<C>(
      init: Input,
      read: (url: URL) => C,
      write: (ref: Ref, config: C) => void,
    ): Dsl.Ref<C>;
  };

  /** Inputs accepted by URL ref factories. */
  export type Input = t.UrlLike | t.StringUrl;

  /** ImmutableRef handle for a URL value. */
  export type Ref = t.ImmutableRef<URL, Patch>;

  /** Readonly ImmutableRef handle for a URL value. */
  export type RefReadonly = t.ImmutableRefReadonly<URL, Patch>;

  /** RFC-6902 patch operation for URL mutations. */
  export type Patch = t.Rfc6902PatchOperation;

  /** Immutable URL DSL contracts. */
  export namespace Dsl {
    export type Ref<C> = {
      readonly url: ImmutableUrl.RefReadonly;
      readonly current: C;
      readonly change: (fn: (draft: C) => void) => void;
    };
  }
}
```

Remove `ImmutableUrlLib`, `UrlRef`, `UrlRefReadonly`, `UrlPatch`, and `UrlDslRef` after migrating in-scope callers.

## Source files expected to change

### `@sys/immutable` rfc6902

- `code/sys/immutable/src/m.rfc6902/t.ts`
  - Introduce `ImmutableRfc6902.Lib` first.
  - Move event contracts under `ImmutableRfc6902.Events.Lib`.
  - Fold patch helper contract under `ImmutableRfc6902.Patch.Lib`.
  - Remove flat `ImmutableRfc6902Lib` and `ImmutableRfc6902EventsLib`.
  - Remove the `export type * from './t.patch.ts';` lane after patch fold-in.

- `code/sys/immutable/src/m.rfc6902/t.patch.ts`
  - Delete with the `remove` tool after confirming there are no direct imports outside `m.rfc6902/t.ts`.
  - Do not leave `ImmutableRfc6902PatchLib` behind.

- `code/sys/immutable/src/m.rfc6902/m.Immutable.ts`
  - Update runtime object annotation from `t.ImmutableRfc6902Lib` to `t.ImmutableRfc6902.Lib`.

- `code/sys/immutable/src/m.rfc6902/m.Events.ts`
  - Update runtime object annotation from `t.ImmutableRfc6902EventsLib` to `t.ImmutableRfc6902.Events.Lib`.

- `code/sys/immutable/src/m.rfc6902/m.Patch.ts`
  - Update runtime object annotation from `t.ImmutableRfc6902PatchLib` to `t.ImmutableRfc6902.Patch.Lib`.

### `@sys/immutable` graph

- `code/sys/immutable/src/m.graph/t.ts`
  - Move `GraphLib` into `Graph.Lib` and keep `Lib` first.
  - Add `Graph.Dag.Lib` for the `Dag` helper object.
  - Preserve existing `Graph.*` and `Graph.Dag.*` contracts.

- `code/sys/immutable/src/m.graph/m.Graph.ts`
  - Update runtime object annotation from `t.GraphLib` to `t.Graph.Lib`.

- `code/sys/immutable/src/m.graph/u.dag.ts`
  - Update `t.GraphLib['Dag']['build']` to `t.Graph.Lib['Dag']['build']` or the direct equivalent `t.Graph.Dag.Build`.

No graph test files are expected to change because the test suite already uses namespace-shaped `t.Graph.*` and `t.Graph.Dag.*` references.

### `@sys/immutable` url

- `code/sys/immutable/src/m.url/t.ts`
  - Introduce `ImmutableUrl.Lib` first.
  - Move input/ref/patch contracts under `ImmutableUrl.*`.
  - Move DSL handle contract under `ImmutableUrl.Dsl.Ref`.
  - Remove flat `ImmutableUrlLib`, `UrlRef`, `UrlRefReadonly`, `UrlPatch`, and `UrlDslRef`.

- `code/sys/immutable/src/m.url/m.Url.ts`
  - Update runtime object annotation from `t.ImmutableUrlLib` to `t.ImmutableUrl.Lib`.

- `code/sys/immutable/src/m.url/u.ref.ts`
  - Update function annotation from `t.ImmutableUrlLib['ref']` to `t.ImmutableUrl.Lib['ref']`.
  - Update `satisfies t.UrlRef` to `satisfies t.ImmutableUrl.Ref`.

- `code/sys/immutable/src/m.url/u.dsl.ts`
  - Update `t.UrlRef` to `t.ImmutableUrl.Ref`.
  - Update `t.UrlDslRef<C>` to `t.ImmutableUrl.Dsl.Ref<C>`.
  - Prefer `t.ImmutableUrl.Input` for the init argument if it keeps the signature clearer.
  - Update readonly URL handle type to `t.ImmutableUrl.RefReadonly` where appropriate.

- `code/sys/immutable/src/m.url/-test/-u.dsl.test.ts`
  - Update `t.UrlRef` to `t.ImmutableUrl.Ref`.
  - Update `t.UrlPatch` to `t.ImmutableUrl.Patch`.

### `@sys/ui-dom` URL caller migration

- `code/sys.ui/ui-dom/src/common/t.ts`
  - Replace the flat import lane `ImmutableUrlLib`, `UrlRef`, `UrlRefReadonly` with the namespace lane `ImmutableUrl` from `@sys/immutable/t`.

- `code/sys.ui/ui-dom/src/m.Url/t.ts`
  - Update `DomUrl = t.ImmutableUrlLib & ...` to `DomUrl = t.ImmutableUrl.Lib & ...`.
  - Update `t.UrlRefReadonly` to `t.ImmutableUrl.RefReadonly`.
  - Update `t.UrlRef` to `t.ImmutableUrl.Ref`.

- `code/sys.ui/ui-dom/src/m.Url/u.bindToWindow.ts`
  - Update function signature from `ref: t.UrlRef` to `ref: t.ImmutableUrl.Ref` unless readonly is sufficient and aligns with `DomUrl.bindToWindow`.

- `code/sys.ui/ui-dom/src/m.Url/-.test.ts`
  - Update signature expectation from `t.UrlRef` to `t.ImmutableUrl.Ref`.

## Legacy alias disposition

Remove during the implementation commit:

- `ImmutableRfc6902Lib` → `ImmutableRfc6902.Lib`
- `ImmutableRfc6902EventsLib` → `ImmutableRfc6902.Events.Lib`
- `ImmutableRfc6902PatchLib` → `ImmutableRfc6902.Patch.Lib`
- `GraphLib` → `Graph.Lib`
- `ImmutableUrlLib` → `ImmutableUrl.Lib`
- `UrlRef` → `ImmutableUrl.Ref`
- `UrlRefReadonly` → `ImmutableUrl.RefReadonly`
- `UrlPatch` → `ImmutableUrl.Patch`
- `UrlDslRef` → `ImmutableUrl.Dsl.Ref`

Retain for this pass only with current caller proof:

- `Graph.Node`
- `Graph.Edge`

Caller evidence for retention:

- `code/sys.driver/driver-automerge/src/t.namespace.ts` currently maps driver graph types through `t.Graph.Node` and `t.Graph.Edge`.

No new deprecated alias block should be introduced. If a newly discovered caller cannot be migrated cleanly, HOLD that portion and ask whether to expand scope or run a dedicated compatibility-alias pass.

## Import/reference updates outside target `t.ts`

Expected internal immutable reference changes:

- `t.ImmutableRfc6902Lib` → `t.ImmutableRfc6902.Lib`
- `t.ImmutableRfc6902EventsLib` → `t.ImmutableRfc6902.Events.Lib`
- `t.ImmutableRfc6902PatchLib` → `t.ImmutableRfc6902.Patch.Lib`
- `t.GraphLib` → `t.Graph.Lib`
- `t.ImmutableUrlLib` → `t.ImmutableUrl.Lib`
- `t.UrlRef` → `t.ImmutableUrl.Ref`
- `t.UrlRefReadonly` → `t.ImmutableUrl.RefReadonly`
- `t.UrlPatch` → `t.ImmutableUrl.Patch`
- `t.UrlDslRef<C>` → `t.ImmutableUrl.Dsl.Ref<C>`

Expected `@sys/ui-dom` reference changes:

- `export type { ImmutableUrlLib, UrlRef, UrlRefReadonly } from '@sys/immutable/t';` → namespace import/re-export for `ImmutableUrl`.
- `t.ImmutableUrlLib` → `t.ImmutableUrl.Lib`.
- `t.UrlRef` → `t.ImmutableUrl.Ref`.
- `t.UrlRefReadonly` → `t.ImmutableUrl.RefReadonly`.

## Implementation sequence

1. Reconfirm alias/caller residue before edits with narrow `rg` searches over `code/sys/immutable/src`, `code/sys.ui/ui-dom/src`, and known downstream graph callers.
2. Refactor `m.rfc6902/t.ts` into `ImmutableRfc6902.Lib`, `ImmutableRfc6902.Events.Lib`, and `ImmutableRfc6902.Patch.Lib`.
3. Remove `m.rfc6902/t.patch.ts` with `remove` after confirming no direct imports remain.
4. Migrate rfc6902 implementation annotations.
5. Refactor `m.graph/t.ts` into `Graph.Lib` and `Graph.Dag.Lib`; migrate graph implementation annotations.
6. Refactor `m.url/t.ts` into `ImmutableUrl.Lib`, `ImmutableUrl.Ref`, `ImmutableUrl.RefReadonly`, `ImmutableUrl.Patch`, and `ImmutableUrl.Dsl.Ref`.
7. Migrate immutable URL implementation and tests.
8. Migrate `@sys/ui-dom` URL type callers so no flat URL aliases need to remain.
9. Run formatting, checks, tests, and residue searches.
10. Commit implementation only after verification passes.

## Verification plan

Formatting:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/immutable && deno fmt --check ./src/m.rfc6902/t.ts ./src/m.rfc6902/m.Immutable.ts ./src/m.rfc6902/m.Events.ts ./src/m.rfc6902/m.Patch.ts ./src/m.graph/t.ts ./src/m.graph/m.Graph.ts ./src/m.graph/u.dag.ts ./src/m.url/t.ts ./src/m.url/m.Url.ts ./src/m.url/u.ref.ts ./src/m.url/u.dsl.ts ./src/m.url/-test/-u.dsl.test.ts
cd /Users/phil/code/org.sys/sys/code/sys.ui/ui-dom && deno fmt --check ./src/common/t.ts ./src/m.Url/t.ts ./src/m.Url/u.bindToWindow.ts ./src/m.Url/-.test.ts
```

Module checks/tests:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/immutable && deno task check
cd /Users/phil/code/org.sys/sys/code/sys/immutable && deno task test
cd /Users/phil/code/org.sys/sys/code/sys.ui/ui-dom && deno task check
cd /Users/phil/code/org.sys/sys/code/sys.ui/ui-dom && deno task test ./src/m.Url
```

Repository hygiene:

```sh
git diff --check
rg -n "\b(ImmutableRfc6902Lib|ImmutableRfc6902EventsLib|ImmutableRfc6902PatchLib|GraphLib|ImmutableUrlLib|UrlRefReadonly|UrlRef\b|UrlPatch|UrlDslRef)\b" /Users/phil/code/org.sys/sys/code/sys/immutable/src /Users/phil/code/org.sys/sys/code/sys.ui/ui-dom/src
```

Expected residue-search result: no matches for the removed flat aliases in the immutable and ui-dom source scopes. Matches for retained `t.Graph.Node` / `t.Graph.Edge` outside this scope are acceptable only because this plan explicitly retains those existing namespace aliases.

## HOLD conditions

HOLD before implementation if any of these are true:

- A direct import of `code/sys/immutable/src/m.rfc6902/t.patch.ts` is found outside the rfc6902 type barrel; decide whether to keep the file as a forwarding type file or expand migration scope.
- `@sys/ui-dom` URL callers cannot be migrated in the same implementation commit; split `m.url` out rather than adding flat compatibility aliases.
- The human wants `Graph.Node` / `Graph.Edge` removed as compatibility aliases; expand scope to migrate `code/sys.driver/driver-automerge/src/t.namespace.ts` and verify that package, or defer to a dedicated alias-removal pass.
- A proposed type namespace collides with `@sys/std/t` or `@sys/types` re-exports during `deno task check`; stop and choose the non-colliding root rather than force a barrel ambiguity.
- Any implementation step requires changing runtime behavior, runtime exports, package exports, or public API breadth beyond moving existing types under namespace-first names.

## Risks

- URL is the riskiest leaf because `@sys/ui-dom` imports the flat URL aliases from `@sys/immutable/t`. The plan avoids compatibility aliases by migrating that caller lane immediately.
- `m.rfc6902/t.patch.ts` deletion is safe only if no direct imports exist; reconfirm immediately before deletion.
- `Graph` has broad downstream use, but most callers already use `t.Graph.*` and `t.Graph.Dag.*`. The implementation should avoid changing those stable names.

## S-tier implementation commit message

```text
refactor(immutable): align leaf type surfaces with namespace spine
```
