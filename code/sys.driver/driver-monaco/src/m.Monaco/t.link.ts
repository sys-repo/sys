import type { t } from './common.ts';

/**
 * Tools for working with links in the code-editor.
 */
export type EditorLinkLib = {
  /**
   * Build a bounds snapshot from a model and range.
   */
  toLinkBounds(args: { model: t.Monaco.TextModel; range: t.Monaco.I.IRange }): t.EditorLinkBounds;

  /**
   * Build a bounds snapshot from a Monaco link.
   */
  linkToBounds(args: { model: t.Monaco.TextModel; link: t.Monaco.I.ILink }): t.EditorLinkBounds;

  /**
   * Construct a Monaco Range from bounds.
   */
  toRange(bounds: t.EditorLinkBounds): t.Monaco.I.IRange;
};

/**
 * Snapshot of a detected inline link within a Monaco text model.
 *
 * - Identifies the host model via `modelUri`.
 * - Captures both positional forms: `range` (lines/cols) and absolute offsets.
 * - `start`/`end` mirror the range’s endpoints for convenience.
 */
export type EditorLinkBounds = {
  /** URI that uniquely identifies the Monaco text model containing the link. */
  modelUri: t.Monaco.Uri;

  /** Start position (1-based line/column) of the link. */
  start: t.Monaco.I.IPosition;

  /** End position (1-based line/column) of the link. */
  end: t.Monaco.I.IPosition;

  /** Inclusive range (1-based line/column) spanning the link. */
  range: t.Monaco.I.IRange;

  /** Absolute character offset at `start` (0-based from start of model). */
  startOffset: number;

  /** Absolute character offset at `end` (0-based from start of model). */
  endOffset: number;
};
