import type { t } from './common.ts';

/**
 * Tools for working with the code-hiding aspects
 * of the editor (aka. "code folding").
 */
export type EditorHiddenLib = Readonly<{
  /**
   * Watch the editor's hidden-area list.
   */
  observe(editor: t.Monaco.Editor, dispose$?: t.UntilInput): t.EditorHiddenAreaObserver;

  /**
   * Fold (hide) one or more **whole lines** without clobbering the
   * editor’s existing hidden-area list.
   *
   * @param editor  Monaco editor instance.
   * @param start   First line to hide – 1-based.
   * @param end     Last line to hide  – 1-based (defaults to `start`).
   *
   * @example
   *   // Fold just line 5:
   *   Monaco.Hidden.foldRange(editor, 5);
   *
   *   // Fold lines 10-20 (inclusive):
   *   Monaco.Hidden.foldRange(editor, 10, 20);
   */
  foldRange(ed: t.Monaco.Editor, start: t.Index, end?: t.Index): void;

  /**
   * Reveal every line by wiping the editor's hidden-area list.
   *
   * @example
   *   Monaco.Hidden.clear(editor);
   */
  clear(ed: t.Monaco.Editor): void;
}>;

/**
 * Live observer of the editor's hidden-area list:
 */
export type EditorHiddenAreaObserver = t.Lifecycle & {
  readonly $: t.Observable<t.EditorHiddenAreaChange>;
  readonly areas: t.Monaco.I.IRange[];
};

/**
 * The methods related to the editor's hidden-area list.
 * NB: explicitly declared because folding helpers
 *     are not (yet) in the d.ts shipped before v0.34.
 */
export type EditorHiddenMembers = {
  /** Current hidden (folded) ranges - expressed as model ranges. */
  getHiddenAreas(): t.Monaco.I.IRange[];
  /** Replace the hidden-area list (pass `[]` to reveal everything). */
  setHiddenAreas(ranges: t.Monaco.I.IRange[]): void;
  /** Fires after any fold/unfold (user action *or* `setHiddenAreas`). */
  onDidChangeHiddenAreas(listener: () => void): t.Monaco.I.IDisposable;
};

/**
 * Event: fires when the editor's hidden-area list changes.
 */
export type EditorHiddenAreaChangeHandler = (e: EditorHiddenAreaChange) => void;
/** Event information about the change. */
export type EditorHiddenAreaChange = Readonly<{ areas: t.Monaco.I.IRange[] }>;
