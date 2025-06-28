import type { t } from './common.ts';

/**
 * Tools for binding between a Monaco editor and
 * an immutable CRDT document interface.
 */
export type EditorCrdtLib = {
  bind(
    model: t.MonacoTextModel | t.MonacoCodeEditor,
    doc: t.CrdtRef,
    path: t.ObjectPath,
    options?: EditorCrdtBindOptions,
  ): t.EditorCrdtBinding;
};

/** Options passed to the CRDT `bind()` method. */
export type EditorCrdtBindOptions = {
  /** Called after **local** edits have produced a new immutable ref */
  onRefChange?: t.EditorCrdtLocalChangeHandler;
};

/**
 * A live binding between a Monaco editor and an immutable CRDT document interface.
 */
export type EditorCrdtBinding = t.Lifecycle & {
  readonly doc: t.CrdtRef;
  readonly path: t.ObjectPath;
};

/**
 * Events:
 */

/** Handler for when local edits have produced an immutable change. */
export type EditorCrdtLocalChangeHandler = (e: EditorCrdtLocalChange) => void;
/** Local CRDT editor change event. */
export type EditorCrdtLocalChange = {
  readonly doc: t.CrdtRef;
  readonly path: t.ObjectPath;
  readonly change: t.CrdtChange;
};
