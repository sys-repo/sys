import type { t } from './common.ts';

/** Method: setup binding. */
export type Bind = (
  args: {
    /** Unifying shared event bus. */
    bus$: t.EditorBus.Subject;
    /** The code-editor being bound to. */
    editor: t.Monaco.Editor;
    /** The CRDT document being bound to. */
    doc: t.CrdtRef;
    /** Path to the field representing the editor text. */
    path: t.ObjectPath;
  },
  /** Destructor trigger. */
  until?: t.UntilInput,
) => Promise<BindingInstance>;

/** A live binding between a Monaco code-editor and an immutable CRDT document interface. */
export type BindingInstance = t.Lifecycle & {
  readonly $: t.EditorBus.Observable;
  readonly doc: t.CrdtRef;
  readonly path: t.ObjectPath;
  readonly model: t.Monaco.TextModel;
};

/** Hook: setup and tear down a Monaco-Crdt two-way data binding. */
export type UseBinding = (args: Args, onReady?: ReadyHandler) => Hook | undefined;

/** Fires when the CRDT data binding is initialized and ready. */
export type ReadyHandler = (e: Ready) => void;

/** Ready event for CRDT editor bindings. */
export type Ready = t.MonacoEditorReady & {
  readonly $: t.Observable<t.EditorEvent.Crdt.Shape>;
};

/** Arguments passed to the CRDT `useBinding` hook. */
export type Args = {
  bus$?: t.EditorBus.Subject;
  monaco?: t.Monaco.Monaco;
  editor?: t.Monaco.Editor;
  doc?: t.CrdtRef;
  path?: t.ObjectPath;
  foldMarks?: boolean;
};

/** An instance of the `useBinding` Monaco-Crdt two-way data binding. */
export type Hook = Omit<BindingInstance, 'dispose'>;
