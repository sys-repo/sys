import type { t } from './common.ts';

/**
 * Tools for binding between a Monaco editor and
 * an immutable CRDT document interface.
 */
export type EditorCrdtLib = Readonly<{
  bind(
    editor: t.Monaco.Editor,
    doc: t.Crdt.Ref,
    path: t.ObjectPath,
    until?: t.UntilInput,
  ): Promise<t.EditorCrdtBinding>;
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
  args: t.UseEditorCrdtBindingArgs,
  onReady?: (e: { binding: t.EditorCrdtBinding; dispose$: t.Observable<void> }) => void,
) => EditorCrdtBindingHook | undefined;

/** Arguments passed to the CRDT `useBinding` hook. */
export type UseEditorCrdtBindingArgs = {
  editor?: t.Monaco.Editor;
  doc?: t.Crdt.Ref;
  path?: t.ObjectPath;
  /** Sync CRDT fold marks with Monaco. (default = off) */
  foldMarks?: boolean;
};

/** An instance of the `useBinding` Monaco-Crdt two-way data binding. */
export type EditorCrdtBindingHook = Omit<t.EditorCrdtBinding, 'dispose'>;

/**
 * Events:
 */

/** Local CRDT editor change event. */
export type EditorCrdtLocalChange = {
  readonly trigger: 'editor' | 'crdt';
  readonly path: t.ObjectPath;
  readonly change: { readonly before: string; readonly after: string };
};
