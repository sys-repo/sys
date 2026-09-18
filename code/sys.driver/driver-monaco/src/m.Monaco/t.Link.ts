import type { t } from './common.ts';

/** Tools for working with links in the code-editor. */
export type Lib = {
  /** Build a bounds snapshot from a model and range. */
  toLinkBounds(args: { model: t.Monaco.TextModel; range: t.Monaco.I.IRange }): Bounds;

  /** Build a bounds snapshot from a Monaco link. */
  linkToBounds(args: { model: t.Monaco.TextModel; link: t.Monaco.I.ILink }): Bounds;

  /** Construct a Monaco Range from bounds. */
  toRange(bounds: Bounds): t.Monaco.I.IRange;

  /** Replace the text within the given bounds. */
  replace(editor: t.Monaco.Editor, bounds: Bounds, text: string): t.Monaco.Position;

  /** Reveal the bounds in the editor viewport. */
  reveal(editor: t.Monaco.Editor, bounds: Bounds): void;
};

/** Snapshot of a detected inline link within a Monaco text model. */
export type Bounds = {
  /** Details about the editor text-model. */
  model: {
    /** URI that uniquely identifies the Monaco text model containing the link. */
    uri: t.Monaco.Uri;
  };

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
