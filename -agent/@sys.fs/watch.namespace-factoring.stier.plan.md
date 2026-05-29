# Watch namespace factoring STIER plan

- [ ] refactor(fs): namespace watch type surface

## Scope

Package: `@sys/fs`.

Primary target:

- `code/sys/fs/src/m.Watch/t.ts`

Expected adjacent updates:

- `code/sys/fs/src/m.Watch/m.Watch.ts`
- `code/sys/fs/src/m.Watch/-.test.ts`
- `code/sys/fs/src/m.Fs/t.ts`
- `code/sys/fs/src/m.Fs.capability/u/u.Files.watch.ts`
- `code/sys/fs/src/m.Fs.capability/-test/-m.Files.toLive.test.ts`
- `code/sys/fs/src/m.Fs.capability/-test/-m.Files.toWritable.test.ts`

Non-goals:

- do not change watcher event behavior;
- do not change `Deno.watchFs` semantics or recursive filtering behavior;
- do not change existing runtime error message text in this pass;
- do not rename `m.Watch.ts` in this pass;
- do not migrate archive material under `-tmp/-archive/` unless explicitly requested.

## XHIGH review position

The current `m.Watch/t.ts` surface is pre-canon flat:

- `FsWatchLib`
- `FsWatcher`
- `FsWatchEvent`

The runtime noun is already `Watch`, so the type surface should be owned by the same noun. The correct
cut is a clean `Watch` namespace with `Watch.Lib` first, a concrete `Watch.Instance` handle, and
`Watch.Event` for emitted filesystem events. The start operation has more than one support type, so
`Watch.Start` is an earned sub-namespace for start input and option contracts.

## Target type shape

```ts
import type { t } from './common.ts';

/**
 * Tools for watching file-system changes.
 */
export declare namespace Watch {
  /** File-system watch helper library. */
  export type Lib = {
    /** Start a file-system watcher instance. */
    readonly start: (
      paths: Start.PathInput,
      options?: Start.Options,
    ) => Promise<Instance>;
  };

  /** A live file-system watcher. */
  export type Instance = t.Lifecycle & {
    readonly $: t.Observable<Event>;

    /** The paths being watched. */
    readonly paths: readonly t.StringPath[];

    /** Flag indicating if all the watched paths exist. */
    readonly exists: boolean;

    /** Watcher mode flags. */
    readonly is: { readonly recursive?: boolean };

    /** Error(s) that may have occurred during setup or while watching. */
    readonly error?: t.StdError;
  };

  /** An event fired by a watched file-system location. */
  export type Event = Deno.FsEvent;

  /**
   * Start operation contracts.
   */
  export namespace Start {
    /** Paths accepted by `Watch.start`. */
    export type PathInput = t.StringPath | t.StringPath[];

    /** Options accepted by `Watch.start`. */
    export type Options = {
      recursive?: boolean;
      until?: t.UntilInput;
    };
  }
}
```

## Namespace factoring decisions

- `Watch.Lib` is the root runtime contract and must appear first.
- `Watch.Instance` replaces `FsWatcher`; it is the live handle returned by `Watch.start`.
- `Watch.Event` replaces `FsWatchEvent`; it is intentionally a root type because capability adapters
  consume events independently of the instance shape.
- `Watch.Start.PathInput` and `Watch.Start.Options` roll up the start operation's input contracts.
- `Start.Options` should not mark its fields `readonly`; it is an input options bag.
- `Instance.paths` should be `readonly t.StringPath[]` because it is exposed state/output.
- Keep `Start.PathInput` as `t.StringPath | t.StringPath[]` for exact compatibility with the current
  `Arr.asArray` substrate; do not widen to readonly arrays in this pass.
- Do not create compatibility aliases unless the human explicitly chooses a compatibility release.

## Compatibility decision

The old flat names can be removed cleanly. `FsWatchLib`, `FsWatcher`, and `FsWatchEvent` are all
prefix aliases for the same runtime noun and should not remain as deprecated residue.

Recommended STIER move: make the canonical namespace cut cleanly and migrate active references to
`t.Watch.*` in the same commit.

## Implementation steps

1. Refactor `src/m.Watch/t.ts` to `export declare namespace Watch` with `Lib` first.
2. Move the live watcher handle to `Watch.Instance`.
3. Move emitted filesystem events to `Watch.Event`.
4. Add `Watch.Start.PathInput` and `Watch.Start.Options`.
5. Update `src/m.Watch/m.Watch.ts`:
   - remove the direct `FsWatchLib` import from `./t.ts`;
   - type the exported runtime as `t.Watch.Lib`;
   - update event and lifecycle annotations to `t.Watch.Event` and `t.Watch.Instance`.
6. Update `src/m.Fs/t.ts`:
   - `watch: t.Watch.Lib['start']`;
   - `Watch: t.Watch.Lib`.
7. Update capability adapter and tests:
   - `t.FsWatchEvent` -> `t.Watch.Event`;
   - `t.FsWatcher` -> `t.Watch.Instance`.
8. Update `src/m.Watch/-.test.ts` event aliases to `t.Watch.Event`.
9. Keep `src/m.Watch/mod.ts` and runtime behavior unchanged unless proof reveals a type-surface mismatch.
10. Search for stale flat references and remove active residue.

## Search checks

Use content search only to locate residue; inspect any unexpected hit with `read` before editing.

```sh
rg -n "FsWatchLib|FsWatchEvent|t\.FsWatch|t\.FsWatcher" /Users/phil/code/org.sys/sys/code/sys/fs/src
```

Expected result after the refactor: no active hits. Native `Deno.FsWatcher` annotations may remain;
they are substrate types, not stale `@sys/fs` contract aliases.

A repo-wide search may still find archive-only material under `-tmp/-archive/`; leave it untouched
unless the human explicitly expands scope.

## Proof plan

From `/Users/phil/code/org.sys/sys/code/sys/fs`:

```sh
deno task test --trace-leaks ./src/m.Watch
```

```sh
deno task test --trace-leaks ./src/m.Fs.capability
```

```sh
deno task check
```

If those are clean and the change is about to close, run the full package test:

```sh
deno task test
```

## STIER residue pass

Before calling complete:

- `src/m.Watch/t.ts` is type-plane pure and has no runtime imports.
- `Watch.Lib` is first in the public namespace.
- `Watch.Start` is the only new sub-namespace because it owns multiple related support types.
- No direct type imports from `./t.ts` remain in `m.Watch` runtime files.
- No stale flat type names remain in active `@sys/fs` source.
- `Instance.paths` is readonly at the type surface.
- Input options are not made readonly.
- Watcher event behavior, recursive filtering, and error message text are unchanged.
- The `paths` getter returns a copy so the readonly output type does not leak mutable internal state.
- Tests assert the same observable behavior as before.

## TMIND failure review

- **Alias residue risk:** leaving `FsWatcher` or `FsWatchEvent` aliases would preserve the old flat
  surface and weaken the namespace cut. Prefer a clean active-source migration.
- **Over-factoring risk:** creating sub-namespaces beyond `Watch.Start` would add hierarchy without
  earned concepts. Keep `Instance` and `Event` at the root.
- **Readonly-input risk:** `Start.Options` is an input bag; adding `readonly` would violate current
  type guidance. Keep readonly for exposed state only.
- **Readonly-array widening risk:** `Start.PathInput` should not accept readonly arrays until the
  implementation substrate supports that shape deliberately.
- **Behavior creep risk:** fixing runtime spelling or changing error messages would exceed a type
  namespace refactor. Leave behavior strings alone; only harden `paths` output to satisfy the
  readonly contract.
- **Archive churn risk:** archive references are not active package surface. Do not migrate them in
  this commit.
