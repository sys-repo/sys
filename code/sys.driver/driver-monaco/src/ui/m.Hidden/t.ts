import type { t } from './common.ts';

/**
 * Tools for working with the code-hiding aspects
 * of the editor (aka. "code folding").
 */
export type EditorHiddenLib = Readonly<{
  /**
   * Watch the editor's hidden-area list.
   */
  observeAreas(editor: t.Monaco.Editor, dispose$?: t.UntilInput): t.EditorHiddenAreaObserver;
}>;

/**
 * Live observer of the editor's hidden-area list:
 */
export type EditorHiddenAreaObserver = t.Lifecycle & {
  readonly $: t.Observable<t.EditorHiddenAreaChange>;
  readonly areas: t.Monaco.IRange[];
};

/**
 * The methods related to the editor's hidden-area list.
 * NB: explicitly declared because folding helpers
 *     are not (yet) in the d.ts shipped before v0.34.
 */
export type EditorHiddenMembers = {
  /** Current hidden (folded) ranges - expressed as model ranges. */
  getHiddenAreas(): t.Monaco.IRange[];
  /** Replace the hidden-area list (pass `[]` to reveal everything). */
  setHiddenAreas(ranges: t.Monaco.IRange[]): void;
  /** Fires after any fold/unfold (user action *or* `setHiddenAreas`). */
  onDidChangeHiddenAreas(listener: () => void): t.Monaco.IDisposable;
};

/**
 * Event: fires when the editor's hidden-area list changes.
 */
export type EditorHiddenAreaChangeHandler = (e: EditorHiddenAreaChange) => void;
/** Event information about the change. */
export type EditorHiddenAreaChange = Readonly<{ areas: t.Monaco.IRange[] }>;
