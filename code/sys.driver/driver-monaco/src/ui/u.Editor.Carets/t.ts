import type { t } from '../common.ts';

/**
 * Editor carets libraryL
 */
export type EditorCaretsLib = {
  readonly Color: t.EditorCaretColorLib;
  create(editor: t.MonacoCodeEditor, options?: { dispose$?: t.UntilInput }): t.EditorCarets;
};

/**
 * Tools for workking with caret colors.
 */
export type EditorCaretColorLib = {
  /** Iterate through a set of colors. */
  next(): string;
};

/**
 * Instance of an editors carets.
 */
export type EditorCarets = t.Lifecycle & {
  readonly $: t.Observable<EditorCaretChanged>;
  readonly editor: t.MonacoCodeEditor;
  readonly current: EditorCaret[];
  identity(id: string): EditorCaret;
  delete(id: string): boolean;
  clear(): EditorCarets;
};

/**
 * Represents a single caret within the editor.
 */
export type EditorCaret = t.Lifecycle & {
  readonly $: t.Observable<EditorCaretChanged>;
  readonly id: string;
  readonly color: string;
  readonly opacity: number;
  readonly selections: t.EditorRange[];
  readonly disposed: boolean;
  change(args: EditorCaretChangeArgs): EditorCaret;
  eq(args: EditorCaretChangeArgs): boolean;
};

/** Arguments passed to the [EditorCaret.change] method. */
export type EditorCaretChangeArgs = {
  selections?: t.EditorRangesInput;
  color?: string;
  opacity?: number; // 0..1
};

/** Caret changed event data. */
export type EditorCaretChanged = {
  id: string;
  current: t.EditorRange[];
  disposed: boolean;
};
