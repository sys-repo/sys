import type { t } from './common.ts';

/**
 * Tools for binding between a Monaco editor and
 * an immutable CRDT document interface.
 */
export type EditorCrdtLib = Readonly<{
  bind(editor: t.Monaco.Editor, doc: t.Crdt.Ref, path: t.ObjectPath): Promise<t.EditorCrdtBinding>;
  useBinding: t.UseEditorCrdtBinding;
}>;

/**
 * A live binding between a Monaco code-editor and
 * an immutable CRDT document interface.
 */
export type EditorCrdtBinding = t.Lifecycle & {
  readonly doc: t.Crdt.Ref;
  readonly path: t.ObjectPath;
  readonly model: t.Monaco.TextModel;
  readonly $: t.Observable<t.EditorCrdtLocalChange>;
};

/**
 * Hook: to setup and tear-down a Monaco-Crdt two-way data binding.
 */
export type UseEditorCrdtBinding = (
  editor: t.Monaco.Editor | undefined,
  doc: t.Crdt.Ref | undefined,
  path: t.ObjectPath | undefined,
  onReady?: (e: { binding: t.EditorCrdtBinding }) => void,
) => EditorCrdtBindingHook;

/** An instance of the `useBinding` Monaco-Crdt two-way data binding. */
export type EditorCrdtBindingHook = {
  readonly binding?: t.EditorCrdtBinding;
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
