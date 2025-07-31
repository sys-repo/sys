import type { t } from './common.ts';

/**
 * Tools for working with the code-hiding aspects
 * of the editor (aka. "code folding").
 */
export type EditorFoldingLib = Readonly<{
  /**
   * Watch the editor's hidden-area list.
   */
  observe(editor: t.Monaco.Editor, dispose$?: t.UntilInput): t.EditorFoldingAreaObserver;

  /**
   * Fold (hide) one or more whole lines (1-based, inclusive).
   *
   * @param editor  Monaco editor instance.
   * @param start   First line to hide – 1-based.
   * @param end     Last line to hide  – 1-based (defaults to `start`).
   */
  fold(ed: t.Monaco.Editor, start: t.Index, end?: t.Index): void;

  /**
   * Unfold (re-reveal) one or more whole lines (1-based, inclusive).
   *
   * @param ed     Monaco editor instance.
   * @param start  First line to reveal – 1-based.
   * @param end    Last line to reveal  – 1-based (defaults to `start`).
   */
  unfold(ed: t.Monaco.Editor, start: t.Index, end?: t.Index): void;

  /**
   * Reveal every line by unfolding all folded ranges.
   */
  clear(ed: t.Monaco.Editor): void;
}>;

/**
 * Live observer of the editor's hidden-area list:
 */
export type EditorFoldingAreaObserver = t.Lifecycle & {
  readonly $: t.Observable<t.EditorFoldingAreaChange>;
  readonly areas: t.Monaco.I.IRange[];
};

/**
 * Event: fires when the editor's hidden-area list changes.
 */
export type EditorFoldingAreaChangeHandler = (e: EditorFoldingAreaChange) => void;
/** Event information about the change. */
export type EditorFoldingAreaChange = Readonly<{ areas: t.Monaco.I.IRange[] }>;
