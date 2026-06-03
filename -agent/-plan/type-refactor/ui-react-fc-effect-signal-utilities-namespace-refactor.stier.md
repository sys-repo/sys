# @sys/ui-react FC/effect/signal utilities namespace refactor

- [x] 137c32303 refactor(ui-react): convert core React type spines to namespace contracts

## Scope

Package: `code/sys.ui/ui-react` (`@sys/ui-react`).

Primary target type spines:

- `code/sys.ui/ui-react/src/m.fc/t.ts`
- `code/sys.ui/ui-react/src/m.effect/t.ts`
- `code/sys.ui/ui-react/src/m.signal/t.ts`
- `code/sys.ui/ui-react/src/u/t.ts`

Adjacent public type spines included because they are re-exported by the primary targets:

- `code/sys.ui/ui-react/src/m.effect/m.EffectController/t.ts`
- `code/sys.ui/ui-react/src/m.effect/m.EffectController/t.hook.ts`
- `code/sys.ui/ui-react/src/m.signal/t.effect.ts`

Single repo-local downstream import lane included to avoid retaining a compatibility alias:

- `code/sys.ui/ui-react-components/src/common/t.ts`

No runtime behavior change is in scope. Runtime values stay in runtime files; `t.ts` and `t.*.ts` stay type-plane only.

## Modern reference shapes inspected

- `code/sys/std/src/m.EffectController/t.ts` — root type alias plus namespace, `Lib` first, local helper types after.
- `code/sys/std/src/m.Signal/t.ts` — existing `Signal<T>` alias plus `Signal.Lib` namespace and nested sub-namespaces.
- `code/sys/crypto/src/m.Hash/t.ts` — `Lib` first with earned sub-namespaces (`Shorten`, `Is`).

These references confirm the target spine: primary runtime concept as the namespace, `Lib` first, then related details under the namespace or earned sub-namespaces.

## XHIGH review decisions

- `u/t.ts` has no runtime `U` object. It must expose one namespace per runtime utility object: `ReactEvent`, `ReactString`, and `ReactChildren`.
- `m.fc/t.ts` must preserve the existing public `t.FC<P>` React component type while adding `t.FC.Lib`. That preservation is not a compatibility alias for `FCLib`; it is an existing public type used across repo-local consumers.
- `m.signal/t.ts` already owns the `Signal` type re-export. Convert that same root into the merged `Signal.Lib` namespace rather than introducing a new `SignalReact` noun.
- `m.effect/m.EffectController/t.ts` should own the React adapter contract as `EffectController.Lib`; hook details belong under `EffectController.Hook.*`.
- `t.hook.ts` and `t.effect.ts` should not remain public flat re-export surfaces after the migration. Merge their exported flat detail types into the owning namespaces, then remove the stale factor files unless implementation proves a factor file is still needed for scanability.
- Do not add deprecated alias blocks. Migrate the only exact live repo-local flat-name caller (`ReactChildrenDepsKey` in `ui-react-components`) in the same refactor.

## Legacy flat names → target namespace shape

### `m.fc/t.ts`

Runtime concept: `FC` from `m.fc/mod.ts`.

Target root:

```ts
export type FC<P = {}> = ReactFC<P>;

export declare namespace FC {
  export type Lib = {
    decorate<P, F extends O>(
      View: ReactFC<P>,
      fields: F,
      options?: { displayName?: string },
    ): ReactFC<P> & F;
  };
}
```

Mapping:

- `FCLib` → `FC.Lib`
- existing root `FC<P>` React component type remains `FC<P>`

Implementation note: move ownership of the `FC` type alias from `src/types.ts` into `m.fc/t.ts` so the alias and namespace are declared by the same type spine.

### `m.effect/t.ts`

Runtime concept: `Effect` from `m.effect/mod.ts`.

Target root:

```ts
export declare namespace Effect {
  export type Lib = Omit<StdEffect.Lib, 'Controller'> & {
    readonly Controller: t.EffectController.Lib;
    readonly useEffectController: t.EffectController.Hook.Fn;
  };
}
```

Mapping:

- `EffectReactLib` → `Effect.Lib`

### `m.effect/m.EffectController/t.ts`

Runtime concept: `EffectController` from `m.effect/m.EffectController/mod.ts`.

Target root:

```ts
export declare namespace EffectController {
  export type Lib = StdEffectController.Lib & {
    readonly useEffectController: Hook.Fn;
  };

  export namespace Hook {
    export type Fn = <State, Patch = Partial<State>, Props = undefined>(
      controller: t.EffectController<State, Patch, Props> | undefined,
      options?: Options<State, Patch, Props> | ChangeHandler<State, Patch, Props>,
    ) => State | undefined;

    export type ChangeHandler<State, Patch = Partial<State>, Props = undefined> = (
      e: ChangeEvent<State, Patch, Props>,
    ) => void;

    export type ChangeEvent<State, Patch = Partial<State>, Props = undefined> = {
      readonly controller: t.EffectController<State, Patch, Props>;
      readonly state: State;
    };

    export type Options<State, Patch = Partial<State>, Props = undefined> = {
      onChange?: ChangeHandler<State, Patch, Props>;
      readonly fireOnInit?: boolean;
    };
  }
}
```

Mapping:

- `EffectControllerReactLib` → `EffectController.Lib`
- `UseEffectController` → `EffectController.Hook.Fn`
- `UseEffectControllerChangeHandler` → `EffectController.Hook.ChangeHandler`
- `EffectControllerChangeEvent` → `EffectController.Hook.ChangeEvent`
- `UseEffectControllerOptions` → `EffectController.Hook.Options`

### `m.signal/t.ts`

Runtime concept: `Signal` from `m.signal/mod.ts`.

Target root:

```ts
export type { ReadonlySignal, Signal, SignalValue, UnwrapSignals } from '@sys/types';

export declare namespace Signal {
  export type Lib = StdSignal.Lib & {
    readonly useSignal: typeof Preact.useSignal;
    readonly useEffect: Effect.Listener;
    readonly useRedrawEffect: RedrawEffect.Listener;
  };

  export namespace Effect {
    export type Listener = (fn: Fn) => void;
    export type Fn = (e: Args) => void | (() => void);
    export type Args = { readonly life: t.Abortable };
  }

  export namespace RedrawEffect {
    export type Listener = (fn: Fn) => void;
    export type Fn = (e: Signal.Effect.Args) => void | (() => void);
  }
}
```

Mapping:

- `SignalReactLib` → `Signal.Lib`
- `UseSignalEffectListener` → `Signal.Effect.Listener`
- `UseSignalEffectFn` → `Signal.Effect.Fn`
- `UseSignalEffectFnArgs` → `Signal.Effect.Args`
- `UseRedrawEffectListener` → `Signal.RedrawEffect.Listener`
- `UseRedrawEffectFn` → `Signal.RedrawEffect.Fn`
- unexported `EffectReturn` → inline return shape or local non-exported helper only; do not promote unless required by the checker

### `u/t.ts`

Runtime concepts: `ReactEvent`, `ReactString`, and `ReactChildren` from `u/mod.ts`.

Target roots:

```ts
export declare namespace ReactEvent {
  export type Lib = {
    modifiers(
      e: React.MouseEvent | MouseEvent | KeyboardEvent | PointerEvent | Event,
    ): t.Keyboard.Modifier.Flags;
  };
}

export declare namespace ReactString {
  export type Lib = {
    break(text: string | t.ReactNode): t.ReactNode;
  };
}

export declare namespace ReactChildren {
  export type Lib = {
    deps(children?: t.ReactNode): DepsKey;
    useDeps(children?: t.ReactNode): DepsKey;
  };

  export type DepsKey = string;
}
```

Mapping:

- `ReactEventLib` → `ReactEvent.Lib`
- `ReactStringLib` → `ReactString.Lib`
- `ReactChildrenLib` → `ReactChildren.Lib`
- `ReactChildrenDepsKey` → `ReactChildren.DepsKey`

## Source files expected to change

### Package type roots and import lanes

- `code/sys.ui/ui-react/src/types.ts`
  - Remove the standalone `export type { FC } from 'react'` ownership after `m.fc/t.ts` preserves `FC<P>` locally.
  - Keep `JSX` usage for `RenderOutput` unchanged.
- `code/sys.ui/ui-react/src/common/t.ts`
  - If needed for unambiguous local type-pool merging, explicitly prefer local merged roots such as `FC` and `Signal` from `../types.ts` before broad `@sys/types` export-star behavior.
  - Do not route runtime values through this file.

### `m.fc`

- `code/sys.ui/ui-react/src/m.fc/t.ts`
  - Convert `FCLib` to `FC.Lib`.
  - Preserve root `FC<P>` as the React function-component type.
- `code/sys.ui/ui-react/src/m.fc/FC.tsx`
  - Update the contract annotation from `FCLib` to `t.FC.Lib` or an equivalent namespace-qualified type.
  - Remove the direct `FCLib` import.

### `m.effect`

- `code/sys.ui/ui-react/src/m.effect/t.ts`
  - Convert `EffectReactLib` to `Effect.Lib`.
  - Keep the `EffectController` type re-export, but only as a namespace-shaped contract surface.
- `code/sys.ui/ui-react/src/m.effect/m.Effect.ts`
  - Update `t.EffectReactLib` → `t.Effect.Lib`.
- `code/sys.ui/ui-react/src/m.effect/m.EffectController/t.ts`
  - Convert `EffectControllerReactLib` to `EffectController.Lib`.
  - Merge hook detail types under `EffectController.Hook.*`.
- `code/sys.ui/ui-react/src/m.effect/m.EffectController/t.hook.ts`
  - Remove after hook types are merged into `t.ts`.
- `code/sys.ui/ui-react/src/m.effect/m.EffectController/m.EffectController.ts`
  - Update `t.EffectControllerReactLib` → `t.EffectController.Lib`.
- `code/sys.ui/ui-react/src/m.effect/m.EffectController/u.useEffectController.ts`
  - Update `t.UseEffectController` → `t.EffectController.Hook.Fn`.
  - Update options and change-handler references to `t.EffectController.Hook.Options` and `t.EffectController.Hook.ChangeHandler`.

### `m.signal`

- `code/sys.ui/ui-react/src/m.signal/t.ts`
  - Convert `SignalReactLib` to `Signal.Lib`.
  - Merge effect hook details under `Signal.Effect.*` and `Signal.RedrawEffect.*`.
  - Preserve existing signal type re-exports from `@sys/types`.
- `code/sys.ui/ui-react/src/m.signal/t.effect.ts`
  - Remove after effect hook details are merged into `t.ts`.
- `code/sys.ui/ui-react/src/m.signal/m.Signal.ts`
  - Update `t.SignalReactLib` → `t.Signal.Lib`.
- `code/sys.ui/ui-react/src/m.signal/u.useEffect.ts`
  - Update `t.UseSignalEffectListener` → `t.Signal.Effect.Listener`.
  - Update `t.UseSignalEffectFnArgs` → `t.Signal.Effect.Args`.
- `code/sys.ui/ui-react/src/m.signal/u.useRedrawEffect.ts`
  - Update `t.UseRedrawEffectListener` → `t.Signal.RedrawEffect.Listener`.

### `u`

- `code/sys.ui/ui-react/src/u/t.ts`
  - Convert flat utility lib names to `ReactEvent.Lib`, `ReactString.Lib`, and `ReactChildren.Lib`.
  - Move `ReactChildrenDepsKey` to `ReactChildren.DepsKey`.
- `code/sys.ui/ui-react/src/u/m.ReactEvent.ts`
  - Update `ReactEventLib` → `t.ReactEvent.Lib` or equivalent namespace-qualified type.
- `code/sys.ui/ui-react/src/u/m.ReactString.tsx`
  - Update `ReactStringLib` → `t.ReactString.Lib` or equivalent namespace-qualified type.
- `code/sys.ui/ui-react/src/u/m.ReactChildren.ts`
  - Update `ReactChildrenLib` → `t.ReactChildren.Lib` or equivalent namespace-qualified type.
- `code/sys.ui/ui-react/src/u/m.ReactChildren.deps.ts`
  - Update `t.ReactChildrenLib['deps']` → `t.ReactChildren.Lib['deps']`.

### Downstream repo-local caller migration

- `code/sys.ui/ui-react-components/src/common/t.ts`
  - Replace the flat `ReactChildrenDepsKey` type import from `@sys/ui-react/t` with the namespace-shaped `ReactChildren` import/export.
  - This is the only exact current repo-local caller evidence for a flat legacy name outside `@sys/ui-react`; migrate it rather than retain `ReactChildrenDepsKey`.

## Legacy alias disposition

Do not keep compatibility aliases for these retired flat names:

- `FCLib`
- `EffectReactLib`
- `EffectControllerReactLib`
- `UseEffectController`
- `UseEffectControllerChangeHandler`
- `EffectControllerChangeEvent`
- `UseEffectControllerOptions`
- `SignalReactLib`
- `UseSignalEffectListener`
- `UseSignalEffectFn`
- `UseSignalEffectFnArgs`
- `UseRedrawEffectListener`
- `UseRedrawEffectFn`
- `ReactEventLib`
- `ReactStringLib`
- `ReactChildrenLib`
- `ReactChildrenDepsKey`

Caller evidence reviewed with targeted search found only one repo-local external flat-name import: `ReactChildrenDepsKey` in `code/sys.ui/ui-react-components/src/common/t.ts`. That caller is in the planned migration set.

Existing root types that are not legacy lib aliases must be preserved:

- `FC<P>` as the React function-component type.
- `Signal<T>` and related signal type re-exports from `@sys/types`.

## Import/reference update lanes

- Prefer `import type { t } from '../common.ts'` or the nearest existing local `common.ts` where available.
- Avoid direct imports of flat names from `./t.ts` after the conversion.
- Runtime object annotations should read as `t.<NS>.Lib`.
- Method-level type references should read as `t.<NS>.<SubNamespace>.<Type>`.
- `mod.ts` files are not expected to change because runtime value surfaces do not change.

## Verification plan

From `code/sys.ui/ui-react`:

```sh
deno task check
deno task test --trace-leaks ./src/m.fc
deno task test --trace-leaks ./src/m.effect
deno task test --trace-leaks ./src/m.signal
deno task test --trace-leaks ./src/u
```

From `code/sys.ui/ui-react-components` after migrating its type-pool import:

```sh
deno task check
```

If implementation changes more than the listed downstream type-pool import, add the narrowest relevant `ui-react-components` test command before full package verification.

## HOLD conditions

- HOLD if `ui-react-components/src/common/t.ts` is declared out of scope. That is the only exact live external caller of `ReactChildrenDepsKey`; excluding it would require an explicit human decision on a temporary alias or a separate compatibility-alias pass.
- HOLD if `deno task check` reveals any additional live flat-name caller outside the planned migration set. Do not add an alias without naming the exact caller.
- HOLD if preserving existing `t.FC<P>` while adding `t.FC.Lib` cannot be done with the namespace merge pattern. Do not remove or rename `t.FC<P>` silently because repo-local consumers use it as a component type.
- HOLD if a type-plane file would need a runtime import/value to satisfy the refactor. Keep type files type-only and ask for a different design.

## Non-goals

- No runtime API changes.
- No new React hooks or helper methods.
- No deprecated alias blocks.
- No broad package skeleton rewrite.
- No changes to generated dependency files.

## S-tier implementation sequence

1. Convert `m.fc/t.ts` first and preserve `FC<P>` ownership there.
2. Update `types.ts`, `common/t.ts` only as needed to preserve the local/public type pool without duplicate-export ambiguity.
3. Convert `m.effect` and `m.EffectController` type spines, then update their runtime annotations.
4. Convert `m.signal/t.ts`, merge/remove signal hook detail types, then update hook implementations.
5. Convert `u/t.ts`, then update `ReactEvent`, `ReactString`, and `ReactChildren` annotations.
6. Migrate `ui-react-components/src/common/t.ts` from `ReactChildrenDepsKey` to `ReactChildren`.
7. Run targeted searches for retired flat names and resolve any planned in-scope callers.
8. Run the verification commands above.

## Final reality

Landed implementation commit:

- `137c32303 refactor(ui-react): convert core React type spines to namespace contracts`

Actual changes:

- Converted `FCLib` to `FC.Lib` while preserving the existing public `FC<P>` component type.
- Converted `EffectReactLib` to `Effect.Lib`.
- Converted `EffectControllerReactLib` and hook flat names to `EffectController.Lib` and `EffectController.Hook.*`.
- Converted `SignalReactLib` and signal hook flat names to `Signal.Lib`, `Signal.Effect.*`, and `Signal.RedrawEffect.*`.
- Converted `ReactEventLib`, `ReactStringLib`, `ReactChildrenLib`, and `ReactChildrenDepsKey` to `ReactEvent.Lib`, `ReactString.Lib`, `ReactChildren.Lib`, and `ReactChildren.DepsKey`.
- Removed stale type factor files after merging their contents into namespace owners:
  - `code/sys.ui/ui-react/src/m.effect/m.EffectController/t.hook.ts`
  - `code/sys.ui/ui-react/src/m.signal/t.effect.ts`
- Migrated the one exact repo-local downstream flat-name caller in `code/sys.ui/ui-react-components/src/common/t.ts` from `ReactChildrenDepsKey` to `ReactChildren`.

Final verification/proof:

- `cd code/sys.ui/ui-react && deno task check` — passed.
- `cd code/sys.ui/ui-react && deno task test --trace-leaks ./src/m.fc` — passed.
- `cd code/sys.ui/ui-react && deno task test --trace-leaks ./src/m.effect` — passed.
- `cd code/sys.ui/ui-react && deno task test --trace-leaks ./src/m.signal` — passed with existing React `act(...)` warnings in redraw-effect tests.
- `cd code/sys.ui/ui-react && deno task test --trace-leaks ./src/u` — passed.
- `cd code/sys.ui/ui-react-components && deno task check` — passed.
- Retired flat-name search was clean after implementation.

Final review result:

- SHIP.
- Remaining risk: none found.
