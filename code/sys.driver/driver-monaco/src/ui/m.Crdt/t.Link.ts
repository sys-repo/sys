import { type t } from './common.ts';

/**
 * Tools for working with "crdt:<id>/path" URI links
 * within the code editor.
 */
export type EditorCrdtLinkLib = Readonly<{
  register: t.EditorCrdtRegisterLink;
}>;

/**
 * Register CRDT link detection + opener; lifecycle-managed.
 */
export type EditorCrdtRegisterLink = (
  e: t.MonacoCtx,
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
  /** Details about the editor text-model. */
  model: {
    /** URI of the editor text-model the link exists within.  */
    uri: t.Monaco.Uri;
  };
  /** raw "crdt:*" as string. */
  raw: string;
  /** Path to the "crdt:*" URI. */
  path: t.ObjectPath;
  /** Flags: */
  is: {
    /** True for "crdt:create". */
    create: boolean;
  };
  /** Snapshot of a detected inline link within a Monaco text model. */
  bounds: t.EditorLinkBounds;
};
