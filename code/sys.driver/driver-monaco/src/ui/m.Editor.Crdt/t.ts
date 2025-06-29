import type { t } from './common.ts';

/**
 * Tools for binding between a Monaco editor and
 * an immutable CRDT document interface.
 */
export type EditorCrdtLib = {
  bind(editor: t.MonacoTypes.Editor, doc: t.CrdtRef, path: t.ObjectPath): t.EditorCrdtBinding;
};

/**
 * A live binding between a Monaco editor and an immutable CRDT document interface.
 */
export type EditorCrdtBinding = t.Lifecycle & {
  readonly doc: t.CrdtRef;
  readonly path: t.ObjectPath;
  readonly model: t.MonacoTypes.TextModel;
  readonly $: t.Observable<t.EditorCrdtLocalChange>;
};

/**
 * Events:
 */

/** Local CRDT editor change event. */
export type EditorCrdtLocalChange = {
  readonly trigger: 'editor' | 'crdt';
  readonly path: t.ObjectPath;
  readonly change: { readonly before: string; readonly after: string };
};
