import type { t } from './common.ts';

/**
 * Tools for binding between a Monaco editor and
 * an immutable CRDT document interface.
 */
export type EditorCrdtLib = {
  bind(editor: t.Monaco.Editor, doc: t.Crdt.Ref, path: t.ObjectPath): t.EditorCrdtBinding;
};

/**
 * A live binding between a Monaco editor and an immutable CRDT document interface.
 */
export type EditorCrdtBinding = t.Lifecycle & {
  readonly doc: t.Crdt.Ref;
  readonly path: t.ObjectPath;
  readonly model: t.Monaco.TextModel;
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
