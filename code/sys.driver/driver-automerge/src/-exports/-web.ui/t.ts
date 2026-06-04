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
    readonly Dev: t.Dev.Lib;
    readonly Repo: t.Repo.Lib;
    readonly Document: t.Document.Lib;
    readonly DocumentId: t.Crdt.DocumentId.Lib;
    readonly Binary: t.Binary.Lib;
    readonly Layout: t.Layout.Lib;
    readonly useRev: t.UseCrdtRev;
    readonly useDoc: t.UseCrdtDoc;
    readonly useDocStats: t.UseCrdtDocStats;
  };

  /**
   * Document-id UI convenience aliases.
   */
  export namespace DocumentId {
    export type Props = t.Crdt.DocumentId.Props;
  }

  /**
   * Layout UI convenience aliases.
   */
  export namespace Layout {
    export type Bindings = t.Layout.Bindings;
    export type Header = t.Layout.Header;
    export type Props = t.Layout.Props;
    export type Sidebar = t.Layout.Sidebar;
    export type Signals = t.Layout.Signals;
    export type Slots = t.Layout.Slots;
    export type Spinning = t.Layout.Spinning;
  }

  /**
   * Binary file UI convenience aliases.
   */
  export namespace BinaryFile {
    export type Props = t.BinaryFile.Props;
    export type Map<T = t.BinaryFile.File> = t.BinaryFile.Map<T>;
  }
}
