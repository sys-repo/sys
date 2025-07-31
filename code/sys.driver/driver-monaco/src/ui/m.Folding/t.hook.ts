import type { t } from './common.ts';

/**
 * React hook that keeps Monaco fold regions ⇄ CRDT "fold" marks in sync.
 */
export type UseFoldMarks = (args: UseFoldMarksArgs) => void;
/** Arguments passed to the `useFoldMarks` hook. */
export type UseFoldMarksArgs = {
  editor?: t.Monaco.Editor;
  doc?: t.Crdt.Ref;
  /** Path to the **string** or **sequence** representing the editor text. */
  path?: t.ObjectPath;
  /** Enable/disable synchronisation (defaults to `true`). */
  enabled?: boolean;
};
