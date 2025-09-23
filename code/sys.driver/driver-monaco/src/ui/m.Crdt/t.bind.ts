import type { t } from './common.ts';

/**
 * Method: setup binding.
 */
export type EditorCrdtBind = (args: {
  editor: t.Monaco.Editor;
  doc: t.Crdt.Ref;
  path: t.ObjectPath;
  until?: t.UntilInput;
  bus$?: t.Subject<t.EditorBindingEvent>;
}) => Promise<t.EditorCrdtBinding>;

/**
 * A live binding between a Monaco code-editor and
 * an immutable CRDT document interface.
 */
export type EditorCrdtBinding = t.Lifecycle & {
  readonly doc: t.Crdt.Ref;
  readonly path: t.ObjectPath;
  readonly model: t.Monaco.TextModel;
  readonly $: t.Observable<t.EditorBindingEvent>;
};

/**
 * Hook: to setup and tear-down a Monaco-Crdt two-way data binding.
 */
export type UseEditorCrdtBinding = (
  args: t.UseEditorCrdtBindingArgs,
  onReady?: EditorCrdtBindingReadyHandler,
) => EditorCrdtBindingHook | undefined;

/** Fires when the CRDT data binding is initialized and ready. */
export type EditorCrdtBindingReadyHandler = (e: EditorCrdtBindingReady) => void;
export type EditorCrdtBindingReady = t.MonacoEditorReady & { binding: t.EditorCrdtBinding };

/** Arguments passed to the CRDT `useBinding` hook. */
export type UseEditorCrdtBindingArgs = {
  monaco?: t.Monaco.Monaco;
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
export type EditorBindingEvent = EditorCrdtChange | EditorFoldingChange;
type BaseChange = {
  readonly trigger: 'editor' | 'crdt';
  readonly path: t.ObjectPath;
};

export type EditorCrdtChange = BaseChange & {
  readonly kind: 'change:text';
  readonly change: { readonly before: string; readonly after: string };
};

export type EditorFoldingChange = BaseChange & {
  readonly kind: 'change:fold';
  readonly change: { readonly before: t.Monaco.I.IRange[]; readonly after: t.Monaco.I.IRange[] };
};
