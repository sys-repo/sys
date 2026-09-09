import type { t } from './common.ts';

/** React hook that keeps Monaco fold regions ⇄ CRDT `fold` marks in sync. */
export type Use = (args: UseArgs) => void;

/** Arguments passed to the `useFoldMarks` hook. */
export type UseArgs = {
  /** Unifying shared event bus. */
  bus$: t.EditorBus.Subject;
  /** The code-editor being bound to. */
  editor?: t.Monaco.Editor;
  /** The CRDT document being bound to. */
  doc?: t.CrdtRef;
  /** Path to the field representing the editor text. */
  path?: t.ObjectPath;
  /** Enable/disable synchronisation (defaults to `true`). */
  enabled?: boolean;
};

/** Pure CRDT ⇄ Monaco fold-mark synchronizer. */
export type Bind = (args: BindArgs) => BindingInstance;

/** Arguments passed to the pure code-folding binder function. */
export type BindArgs = {
  bus$: t.EditorBus.Subject;
  editor: t.Monaco.Editor;
  doc: t.CrdtRef<any>;
  path: t.ObjectPath;
  enabled?: boolean;
  until?: t.UntilInput;
};

/** An instance of an editor fold-marks binding. */
export type BindingInstance = t.Lifecycle & {
  readonly $: t.Observable<t.EditorEvent.Crdt.Marks>;
};
