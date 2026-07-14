import type { t } from './common.ts';

/**
 * Browser CRDT contracts with UI components attached.
 */
export declare namespace CrdtView {
  /** Browser CRDT tools with UI components attached. */
  export type Lib = t.CrdtWeb.Lib & {
    readonly UI: UI;
  };

  /** UI surface attached to the browser CRDT library. */
  export type UI = {
    /** Development/debug UI helpers. */
    readonly Dev: t.Dev.Lib;
    /** Repository UI helpers. */
    readonly Repo: t.Repo.Lib;
    /** Document UI helpers. */
    readonly Document: t.Document.Lib;
    /** Document-id UI helpers. */
    readonly DocumentId: t.Crdt.DocumentId.Lib;
    /** Binary file UI helpers. */
    readonly Binary: t.Binary.Lib;
    /** CRDT layout UI helpers. */
    readonly Layout: t.Layout.Lib;
    /** React hook for tracking CRDT revision changes. */
    readonly useRev: t.UseCrdtRev;
    /** React hook for loading CRDT documents. */
    readonly useDoc: t.UseCrdtDoc;
    /** React hook for reading CRDT document statistics. */
    readonly useDocStats: t.UseCrdtDocStats;
  };

  /**
   * Document-id UI convenience aliases.
   */
  export namespace DocumentId {
    /** Document-id component props. */
    export type Props = t.Crdt.DocumentId.Props;
  }

  /**
   * Layout UI convenience aliases.
   */
  export namespace Layout {
    /** Layout binding contracts. */
    export type Bindings = t.Layout.Bindings;
    /** Layout header contracts. */
    export type Header = t.Layout.Header;
    /** Layout component props. */
    export type Props = t.Layout.Props;
    /** Layout sidebar contracts. */
    export type Sidebar = t.Layout.Sidebar;
    /** Layout signal bundle. */
    export type Signals = t.Layout.Signals;
    /** Layout slot contracts. */
    export type Slots = t.Layout.Slots;
    /** Layout spinner contracts. */
    export type Spinning = t.Layout.Spinning;
  }

  /**
   * Binary file UI convenience aliases.
   */
  export namespace BinaryFile {
    /** Binary file component props. */
    export type Props = t.BinaryFile.Props;
    /** Binary file map keyed by content hash. */
    export type Map<T = t.BinaryFile.File> = t.BinaryFile.Map<T>;
  }
}
