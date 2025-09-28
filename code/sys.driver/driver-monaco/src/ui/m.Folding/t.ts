import type { t } from './common.ts';
export type * from './t.bind.ts';

export type FoldOffset = { start: number; end: number };

/**
 * Tools for working with the code-hiding aspects
 * of the editor (aka. "code folding").
 */
export type EditorFoldingLib = {
  /** Pure CRDT ⇄ Monaco fold-mark synchronizer (lifecycle-based, React-free). */
  readonly bindFoldMarks: t.BindFoldMarks;
  /** React hook for binding to a CRDT - defers to `bindFoldMarks` */
  readonly useFoldMarks: t.UseFoldMarks;

  /**
   * Watch the editor's hidden-area list.
   */
  observe(
    args: { editor: t.Monaco.Editor; bus$?: t.EditorEventBus },
    dispose$?: t.UntilInput,
  ): t.EditorFoldingAreaObserver;

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

  /**
   * Convert editor hidden areas → Automerge sequence ranges.
   * Stores the *parent* (twisty) line as `start`.
   */
  toMarkRanges(model: t.Monaco.TextModel, areas: t.Monaco.I.IRange[]): t.Crdt.Mark.Range[];

  /**
   * Return *all* folded regions, independent of scroll position.
   *
   * NOTE: Uses the internal view-model API (`_getViewModel().getHiddenAreas()`),
   *       which has been stable since Monaco 0.21 (2021-03) but is not public.
   *       If that ever changes swap the implementation here only.
   */
  getHiddenAreas(editor: t.Monaco.Editor): t.Monaco.I.IRange[];
};

/**
 * Live observer of the editor's hidden-area list:
 */
export type EditorFoldingAreaObserver = t.Lifecycle & {
  readonly $: t.Observable<t.EventEditorFolding>;
  readonly areas: t.Monaco.I.IRange[];
};
