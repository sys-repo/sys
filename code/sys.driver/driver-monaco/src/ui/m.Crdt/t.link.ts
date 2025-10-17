import { type t } from './common.ts';

/**
 * Tools for working with "crdt:<id>/path" URI links
 * within the code editor.
 */
export type EditorCrdtLinkLib = Readonly<{
  register: t.EditorCrdtRegisterLink;
  create: t.EditorCrdtLinkCreateDoc;
  enable: t.EditorCrdtLinkEnable;
}>;

/**
 * Register CRDT link detection + opener; lifecycle-managed.
 */
export type EditorCrdtRegisterLink = (
  ctx: t.MonacoCtx,
  options?: t.EditorCrdtRegisterLinkOptions | t.EditorCrdtLinkClickHandler,
) => t.Lifecycle;

/** Options passed to the `Crdt.registerLink` method. */
export type EditorCrdtRegisterLinkOptions = {
  language?: t.EditorLanguage;
  onLinkClick?: t.EditorCrdtLinkClickHandler;
  until?: t.UntilInput;
};

/**
 * Event handler for click actions on inline registered
 * link structures within the code-editor.
 */
export type EditorCrdtLinkClickHandler = (e: EditorCrdtLinkClick) => void;
/** Event arguments for when a link is CMD clicked within the code-editor. */
export type EditorCrdtLinkClick = Readonly<{
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
}>;

/**
 * Creates a new CRDT document via the given repo and inserts
 * its `crdt:<id>` link into the editor at the specified bounds.
 *
 * Use case: this is triggered typically via a click on
 * the "crdt:create" link action.
 */
export type EditorCrdtLinkCreateDoc = (
  ctx: t.MonacoCtx,
  repo: t.CrdtRepo,
  bounds: t.EditorLinkBounds,
) => EditorCrdtLinkCreateResult;

/**
 * Result from `EditorCrdtLink.create`.
 */
export type EditorCrdtLinkCreateResult = {
  doc?: t.CrdtRef;
  error?: t.StdError;
};

/**
 * Registers a link listener on the given editor context and
 * handles events such as `crdt:create` by invoking `Link.create` etc.
 */
export type EditorCrdtLinkEnable = (
  ctx: t.MonacoCtx,
  repo: t.CrdtRepo,
  options?: t.EditorCrdtLinkEnableOptions | t.UntilInput,
) => t.Lifecycle;

/** Options passed to the `Link.enable` method. */
export type EditorCrdtLinkEnableOptions = {
  onCreate?: (e: t.EditorCrdtLinkCreateResult) => void;
  until?: t.UntilInput;
};
