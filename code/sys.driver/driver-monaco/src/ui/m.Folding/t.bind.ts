import type { t } from './common.ts';

type FoldRange = { readonly start: number; readonly end: number };

/**
 * React hook that keeps Monaco fold regions ⇄ CRDT "fold" marks in sync.
 */
export type UseFoldMarks = (args: UseFoldMarksArgs) => void;

/** Arguments passed to the `useFoldMarks` hook. */
export type UseFoldMarksArgs = {
  /** The code-editor being bound to. */
  editor?: t.Monaco.Editor;
  /** The CRDT document being bound to. */
  doc?: t.Crdt.Ref;
  /** Path to the **string** or **sequence** representing the editor text. */
  path?: t.ObjectPath;
  /** Enable/disable synchronisation (defaults to `true`). */
  enabled?: boolean;
  /** Unifiying shared event bus. */
  bus$?: t.Subject<t.EditorBindingEvent>;
};

/**
 * Pure CRDT ⇄ Monaco fold-mark synchronizer (lifecycle-based, React-free).
 */
export type BindFoldMarks = (args: t.BindFoldMarksArgs) => EditorFoldBinding;
/** Arguments passed to the pure code-folding binder function. */
export type BindFoldMarksArgs = {
  editor: t.Monaco.Editor;
  doc: t.Crdt.Ref<any>;
  path: t.ObjectPath;
  enabled?: boolean;
  until?: t.Lifecycle;
  bus$?: t.Subject<t.EditorBindingEvent>;
};

/**
 * An instance of an editor fold-marks binding.
 */
export type EditorFoldBinding = t.Lifecycle & {
  readonly $: t.Observable<t.EditorFoldingChange>;
};
