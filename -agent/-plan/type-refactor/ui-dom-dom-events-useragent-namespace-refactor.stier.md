# @sys/ui-dom Dom, Events, and UserAgent namespace refactor

- [x] cdb509e7e refactor(ui-dom): canonicalize dom event and user-agent type namespaces

## Purpose

Convert the `@sys/ui-dom` Dom, Events, and UserAgent type spines from legacy flat names to the canonical namespace shape used by modern `@sys/*` modules.

Runtime values stay stable:

```ts
Dom
Dom.Event
Dom.UserHas
UserHas
UserAgent
```

Primary type surfaces become namespace-first:

```ts
t.Dom.Lib
t.Dom.Event.Lib
t.UserHas.Lib
t.UIEvent.Base
t.UIEvent.ModifierKeys
t.UserAgent.Lib
t.UserAgent.Info
t.UserAgent.Flags
t.UserAgent.OS
```

## XHIGH review result

The probe direction is sound, with two refinements:

- `m.Events` must not grow an artificial `Events.Lib`; the actual runtime root is `UserHas`, while DOM event snapshot types are the `UIEvent` concept already isolated in `t.dom.ts`.
- `UserAgent` needs a non-stuttering data type name. Use `UserAgent.Info` for the value returned by `UserAgent.current`, not `UserAgent.UserAgent`.

Modern comparison checked: `code/sys/crypto/src/m.Hash/t.ts` and `code/sys/crypto/src/m.Hash/m.Hash.ts`.

Relevant canonical pattern:

```ts
export declare namespace Hash {
  export type Lib = {
    readonly Is: Is.Lib;
    sha256(input: unknown, options?: Options): string;
  };

  export namespace Is {
    export type Lib = { /* ... */ };
  }
}
```

The implementation then satisfies the namespace contract through the local type lane:

```ts
export const Hash: t.Hash.Lib = { /* ... */ };
```

This plan follows that shape: `Lib` first, sub-namespaces only when the runtime or type concept earns them, and implementation files use `import { type t } from './common.ts'` or the adjacent local common lane.

## Current legacy flat names → target names

| Current flat name | Target name |
| --- | --- |
| `DomLib` | `Dom.Lib` |
| `DomEventLib` | `Dom.Event.Lib` |
| `ComponentDataAttribute` | `Dom.Component.DataAttribute` |
| `DomWalkFilter` | `Dom.Walk.Filter` |
| `DomWalkFilterArgs` | `Dom.Walk.Args` |
| `UserHasLib` | `UserHas.Lib` |
| `UIEventBase` | `UIEvent.Base` |
| `UIModifierKeys` | `UIEvent.ModifierKeys` |
| `UserAgentLib` | `UserAgent.Lib` |
| `UserAgent` | `UserAgent.Info` |
| `UserAgentFlags` | `UserAgent.Flags` |
| `UserAgentOS` | `UserAgent.OS` |

## Target type shape

### `code/sys.ui/ui-dom/src/m.Dom/t.ts`

```ts
import type { t } from './common.ts';

/**
 * Helpers for working with the browser DOM (document object model).
 */
export declare namespace Dom {
  /** DOM helper library surface. */
  export type Lib = {
    readonly Event: Event.Lib;
    readonly UserHas: t.UserHas.Lib;
  };

  /**
   * DOM event helper contracts.
   */
  export namespace Event {
    /** Helpers for working with DOM events. */
    export type Lib = {
      isWithin(event: globalThis.Event, match: Component.DataAttribute | Walk.Filter): boolean;
    };
  }

  /**
   * DOM component attribute contracts.
   */
  export namespace Component {
    /** The value of a `data-component="<value>"` attribute. */
    export type DataAttribute = string;
  }

  /**
   * DOM walking contracts.
   */
  export namespace Walk {
    /** Function used while walking the DOM tree. */
    export type Filter = (e: Args) => boolean;

    /** Arguments passed to a DOM walk filter. */
    export type Args = { readonly element: Element };
  }
}
```

Notes:

- Use `globalThis.Event` inside `Dom.Event.Lib` so the nested `Dom.Event` namespace does not shadow the browser event type.
- Keep `Dom.UserHas` typed as `t.UserHas.Lib` because the runtime value is imported from the Events module.

### `code/sys.ui/ui-dom/src/m.Events/t.ts`

```ts
export type * from './t.dom.ts';

/**
 * User interaction state contracts.
 */
export declare namespace UserHas {
  /** User interaction state surface. */
  export type Lib = {
    /** Whether the user has interacted with the current window. */
    readonly interacted: boolean;
  };
}
```

Notes:

- Remove the stale `import type { t } from './common.ts';`; `UserHas.Lib` does not require it.
- Do not add `Events.Lib`; there is no runtime `Events` object.

### `code/sys.ui/ui-dom/src/m.Events/t.dom.ts`

```ts
/**
 * DOM UI event contracts.
 */
export declare namespace UIEvent {
  /** Base properties of a UI event in the DOM. */
  export type Base = {
    readonly bubbles: boolean;
    readonly cancelable: boolean;
    readonly eventPhase: number;
    readonly timeStamp: number;
    readonly isTrusted: boolean;
  };

  /** Modifier key state carried by a UI event. */
  export type ModifierKeys = {
    readonly altKey: boolean;
    readonly ctrlKey: boolean;
    readonly metaKey: boolean;
    readonly shiftKey: boolean;
  };
}
```

Notes:

- Preserve `t.dom.ts` as a type-only factor file.
- Keep `m.Events/t.ts` as the public Events type spine that re-exports the DOM event factor.

### `code/sys.ui/ui-dom/src/m.UserAgent/t.ts`

```ts
/**
 * User-agent contracts.
 */
export declare namespace UserAgent {
  /** User-agent helper library surface. */
  export type Lib = {
    /** Reduced semantic data for the current user-agent. */
    readonly current: Info;
  };

  /** Reduced semantic user-agent data consumed by the app. */
  export type Info = {
    readonly os: OS;
    readonly is: Flags;
  };

  /** Boolean flags derived from a user-agent string. */
  export type Flags = {
    readonly apple: boolean;
    readonly macOS: boolean;
    readonly iOS: boolean;
    readonly iPad: boolean;
    readonly iPhone: boolean;
    readonly chromium: boolean;
    readonly firefox: boolean;
  };

  /** Details about the user-agent operating system. */
  export type OS = {
    readonly name: string;
  };
}
```

Notes:

- Remove `import type { t } from './common.ts';`; the namespace can reference its own `Info` directly.
- Preserve the reduced Bowser-backed contract; do not expose Bowser parser detail.

## Source files expected to change

- `code/sys.ui/ui-dom/src/m.Dom/t.ts`
  - Replace flat `Dom*` aliases with `export declare namespace Dom`.
  - Put `Dom.Lib` first.
  - Move event, component attribute, and walk details under `Dom.*`.

- `code/sys.ui/ui-dom/src/m.Dom/m.Dom.ts`
  - Replace direct `DomLib` import with local type lane.
  - Type runtime value as `t.Dom.Lib`.

- `code/sys.ui/ui-dom/src/m.Dom/m.Dom.Event.ts`
  - Remove direct `DomEventLib` import.
  - Type runtime value as `t.Dom.Event.Lib`.
  - Keep runtime behavior byte-for-byte except type references.

- `code/sys.ui/ui-dom/src/m.Dom/-.test.ts`
  - Replace `t.DomWalkFilter` with `t.Dom.Walk.Filter`.

- `code/sys.ui/ui-dom/src/m.Events/t.ts`
  - Replace flat `UserHasLib` with `export declare namespace UserHas`.
  - Keep `export type * from './t.dom.ts';`.
  - Remove unused type import.

- `code/sys.ui/ui-dom/src/m.Events/t.dom.ts`
  - Replace flat `UIEventBase` and `UIModifierKeys` with `export declare namespace UIEvent`.
  - Keep the file type-plane pure.

- `code/sys.ui/ui-dom/src/m.Events/u.UserHas.ts`
  - Replace `t.UserHasLib` with `t.UserHas.Lib`.

- `code/sys.ui/ui-dom/src/m.UserAgent/t.ts`
  - Replace flat `UserAgent*` aliases with `export declare namespace UserAgent`.
  - Put `UserAgent.Lib` first.
  - Rename the data shape to `UserAgent.Info`.

- `code/sys.ui/ui-dom/src/m.UserAgent/m.UserAgent.ts`
  - Replace direct `UserAgentLib` import with local type lane.
  - Type `_current` as `t.UserAgent.Info | undefined`.
  - Type runtime value as `t.UserAgent.Lib`.

- `code/sys.ui/ui-dom/src/m.UserAgent/u.parse.ts`
  - Change `parseUserAgent` return type to `t.UserAgent.Info`.
  - Change `wrangle.flags` return type to `t.UserAgent.Flags`.

- `code/sys.ui/ui-dom/src/m.UserAgent/-.test.ts`
  - Replace `t.UserAgent` with `t.UserAgent.Info`.
  - Replace `t.UserAgentFlags` with `t.UserAgent.Flags`.

- `code/sys.ui/ui-dom/src/m.Keyboard/t.ts`
  - Replace UserAgent option references with `t.UserAgent.Info`.
  - Replace `t.UIEventBase` with `t.UIEvent.Base`.
  - Replace `t.UIModifierKeys` with `t.UIEvent.ModifierKeys`.

- `code/sys.ui/ui-dom/src/m.Keyboard/-.test.ts`
  - Replace local test fixture type annotations from `t.UserAgent` to `t.UserAgent.Info`.

## Expected unchanged files

- `code/sys.ui/ui-dom/src/types.ts`
  - Already star-exports `m.Dom/t.ts`, `m.Events/t.ts`, and `m.UserAgent/t.ts` through the package type plane.
  - No new export lane is needed.

- `code/sys.ui/ui-dom/src/m.Dom/mod.ts`
- `code/sys.ui/ui-dom/src/m.Events/mod.ts`
- `code/sys.ui/ui-dom/src/m.UserAgent/mod.ts`
  - Runtime export surfaces stay unchanged.

- `code/sys.ui/ui-dom/src/common.ts`
- `code/sys.ui/ui-dom/src/m.Dom/common.ts`
- `code/sys.ui/ui-dom/src/m.Events/common.ts`
- `code/sys.ui/ui-dom/src/m.UserAgent/common.ts`
  - Existing type lane is sufficient.

- `code/sys.ui/ui-dom/deno.json`
  - Existing `./t` and `./types` contract-plane exports remain correct.

## Legacy alias disposition

Do not add compatibility aliases in this pass.

Reasoning:

- Repo-local current callers of the legacy names are all migratable in the same clean refactor.
- The probe found no concrete repo-local caller outside `code/sys.ui/ui-dom` that requires retaining these names.
- Adding alias blocks would widen the public type surface and leave transitional residue without live caller proof.

Explicitly not planned:

```ts
export type DomLib = Dom.Lib;
export type DomEventLib = Dom.Event.Lib;
export type UserAgent = UserAgent.Info;
export type UserAgentLib = UserAgent.Lib;
export type UserHasLib = UserHas.Lib;
```

If implementation discovers a live caller that cannot be migrated in this pass, HOLD before adding an alias and name the caller exactly.

## Import and reference updates outside target `t.ts`

Use the canonical local type lane:

```ts
import { type t } from './common.ts';
```

or, for parent-relative modules already using the parent common lane:

```ts
import { type t } from '../common.ts';
```

Expected migrations:

```ts
DomLib → t.Dom.Lib
DomEventLib → t.Dom.Event.Lib
DomWalkFilter → t.Dom.Walk.Filter
UserHasLib → t.UserHas.Lib
UserAgentLib → t.UserAgent.Lib
UserAgent → t.UserAgent.Info
UserAgentFlags → t.UserAgent.Flags
UIEventBase → t.UIEvent.Base
UIModifierKeys → t.UIEvent.ModifierKeys
```

Do not introduce direct named imports from `./t.ts` for migrated types.

## Type-plane purity gates

Reject any implementation that:

- adds runtime values, side effects, or runtime-module imports to `t.ts` or `t.dom.ts`;
- exposes a new runtime `Events` concept;
- changes runtime object names or runtime module exports;
- expands the UserAgent data contract beyond the current reduced semantic shape;
- adds compatibility aliases without exact live caller proof;
- leaves duplicate flat type names behind after in-scope caller migration.

## HOLD conditions

HOLD and ask before proceeding if any of these appear during implementation:

- a repo-local live caller of a legacy flat name cannot be migrated in the same refactor;
- TypeScript rejects the exported `UIEvent` namespace because of an unanticipated public type collision;
- `Dom.Event.Lib` cannot refer to the native event type cleanly through `globalThis.Event`;
- verification shows runtime behavior drift rather than type-only compile failures;
- the change requires editing generated dependency files or package export config.

## Verification

Run from the nearest module root:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.ui/ui-dom
deno task check
deno task test
```

Expected proof:

- `deno task check` validates all migrated type references in `src/`.
- `deno task test` proves Dom, Events, UserAgent, and Keyboard behavior did not drift.

## Non-goals

- Do not change runtime behavior.
- Do not change package export paths.
- Do not alter `Keyboard` namespace shape in this pass beyond references to `UserAgent` and `UIEvent` types.
- Do not remove or rewrite `m.Events/t.dom.ts`; only convert its flat DOM event types to namespace form.
- Do not add deprecated alias blocks.

## Final reality

Landed implementation:

- `cdb509e7e refactor(ui-dom): canonicalize dom event and user-agent type namespaces`

Actual changes:

- Converted `m.Dom/t.ts` to `Dom.Lib`, `Dom.Event.Lib`, `Dom.Component.*`, and `Dom.Walk.*`.
- Converted `m.Events/t.ts` to `UserHas.Lib` and `m.Events/t.dom.ts` to `UIEvent.Base` / `UIEvent.ModifierKeys`.
- Converted `m.UserAgent/t.ts` to `UserAgent.Lib`, `UserAgent.Info`, `UserAgent.Flags`, and `UserAgent.OS`.
- Migrated adjacent runtime annotations, parser return types, Dom/UserAgent tests, and Keyboard type references to the namespace shape.
- Hardened the final shape: `Dom.Walk.Filter` returns `boolean`, `Dom.Walk.Args.element` is readonly, `UserHas.Lib.interacted` is readonly, and `Keyboard.modifiers` accepts omitted input to match runtime behavior.

Legacy alias disposition:

- No compatibility aliases were retained.
- No deprecated alias blocks were added.
- Final alias scan found no targeted legacy flat names in the touched `@sys/ui-dom` module paths.

Final verification/proof:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.ui/ui-dom
deno task check
deno task test
```

Both passed before the implementation commit.

Final review:

- Result: SHIP for the `.ts` refactor tree.
- Remaining risk: none found in the committed source refactor.
- Note: unrelated plan/docs working-tree changes existed outside the committed implementation scope and were intentionally not included in `cdb509e7e`.
