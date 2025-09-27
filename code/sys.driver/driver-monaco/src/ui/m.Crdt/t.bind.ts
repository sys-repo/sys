import type { t } from './common.ts';

/**
 * Method: setup binding.
 */
export type EditorCrdtBind = (args: {
  /** Unifiying shared event bus. */
  bus$: t.EditorEventBus;
  /** The code-editor being bound to. */
  editor: t.Monaco.Editor;
  /** The CRDT document being bound to. */
  doc: t.CrdtRef;
  /** Path to the field representing the editor text. */
  path: t.ObjectPath;
  /** Destructor trigger. */
  until?: t.UntilInput;
}) => Promise<t.EditorCrdtBinding>;

/**
 * A live binding between a Monaco code-editor and
 * an immutable CRDT document interface.
 */
export type EditorCrdtBinding = t.Lifecycle & {
  readonly doc: t.CrdtRef;
  readonly path: t.ObjectPath;
  readonly model: t.Monaco.TextModel;
  readonly $: t.Observable<t.EditorEvent>;
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
  bus$?: t.EditorEventBus;
  monaco?: t.Monaco.Monaco;
  editor?: t.Monaco.Editor;
  doc?: t.CrdtRef;
  path?: t.ObjectPath;
  foldMarks?: boolean; // Sync CRDT fold marks with Monaco. (default = off)
};

/** An instance of the `useBinding` Monaco-Crdt two-way data binding. */
export type EditorCrdtBindingHook = Omit<t.EditorCrdtBinding, 'dispose'>;
