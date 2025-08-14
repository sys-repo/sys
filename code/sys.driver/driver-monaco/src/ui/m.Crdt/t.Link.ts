import { type t } from './common.ts';

/**
 * Register CRDT link detection + opener; lifecycle-managed.
 */
export type EditorCrdtRegisterLink = (
  e: t.MonacoEditorReady,
  options?: t.EditorCrdtRegisterLinkOptions | t.OnCrdtLinkClickHandler,
) => t.Lifecycle;

/** Options passed to the `Crdt.registerLink` method. */
export type EditorCrdtRegisterLinkOptions = {
  language?: t.EditorLanguage;
  onLinkClick?: t.OnCrdtLinkClickHandler;
  until?: t.UntilInput;
};

/**
 * Event handler for click actions on inline registered link structures
 * within the code-editor.
 */
export type OnCrdtLinkClickHandler = (e: OnCrdtLinkClick) => void;
/** Event arguments for when a link is CMD clicked within the code-editor. */
export type OnCrdtLinkClick = {
  uri: t.Monaco.Uri;
  /** raw "crdt:*" as string. */
  raw: string;
  /** Path to the "crdt:*" URI. */
  path: t.ObjectPath;
  /** RFC6901-encoded key of the path ("" for create) */
  key: string;
  /** Flags: */
  is: {
    /** True for "crdt:create". */
    create: boolean;
  };
  /** Snapshot of a detected inline link within a Monaco text model. */
  bounds: t.EditorLinkBounds;
};
