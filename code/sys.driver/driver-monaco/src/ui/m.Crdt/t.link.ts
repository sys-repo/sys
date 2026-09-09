import { type t } from './common.ts';

/** Tools for working with `crdt:<id>/path` URI links within the code editor. */
export type Lib = Readonly<{
  register: Register;
  create: CreateDoc;
  enable: Enable;
}>;

/** Register CRDT link detection and opener with lifecycle management. */
export type Register = (
  ctx: t.MonacoDriver.Ctx,
  options?: RegisterOptions | ClickHandler,
) => Promise<t.Lifecycle>;

/** Options passed to the `Crdt.registerLink` method. */
export type RegisterOptions = {
  language?: t.EditorLanguage;
  onLinkClick?: ClickHandler;
  until?: t.UntilInput;
};

/** Event handler for click actions on inline registered link structures. */
export type ClickHandler = (e: Click) => void;

/** Event arguments for when a link is CMD clicked within the code-editor. */
export type Click = Readonly<{
  /** Details about the editor text-model. */
  model: {
    /** URI of the editor text-model the link exists within. */
    uri: t.Monaco.Uri;
  };
  /** Raw `crdt:*` as string. */
  raw: string;
  /** Path to the `crdt:*` URI. */
  path: t.ObjectPath;
  /** Flags. */
  is: {
    /** True for `crdt:create`. */
    create: boolean;
  };
  /** Snapshot of a detected inline link within a Monaco text model. */
  bounds: t.MonacoDriver.Link.Bounds;
}>;

/** Create a new CRDT document via the given repo and insert its link into the editor. */
export type CreateDoc = (
  ctx: t.MonacoDriver.Ctx,
  repo: t.CrdtRepo,
  bounds: t.MonacoDriver.Link.Bounds,
) => Promise<CreateResult>;

/** Result from `EditorCrdt.Link.create`. */
export type CreateResult = t.Crdt.RefResult;

/** Register a link listener on the given editor context. */
export type Enable = (
  ctx: t.MonacoDriver.Ctx,
  repo: t.CrdtRepo,
  options?: EnableOptions | t.UntilInput,
) => Promise<t.Lifecycle>;

/** Options passed to the `Link.enable` method. */
export type EnableOptions = {
  onCreate?: (e: CreateResult) => void;
  until?: t.UntilInput;
};
