import type { t } from './common.ts';

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
};

/**
 * Pure CRDT ⇄ Monaco fold-mark synchronizer (lifecycle-based, React-free).
 */
export type BindFoldMarks = (args: t.BindFoldMarksArgs) => t.Lifecycle;
/** Arguments passed to the pure code-folding binder function. */
export type BindFoldMarksArgs = {
  editor: t.Monaco.Editor & t.EditorHiddenMembers;
  doc: t.Crdt.Ref<any>;
  path: t.ObjectPath;
  enabled?: boolean;
  until?: t.Lifecycle;
};
