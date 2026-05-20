import type { t } from '../common.ts';
import type { FilesBase } from './t.base.ts';
import type { FilesCapability } from './t.capability.ts';
import type { FilesChange } from './t.change.ts';
import type { FilesContentRef } from './t.content-ref.ts';
import type { FilesCursor } from './t.cursor.ts';
import type { FilesEntry } from './t.entry.ts';
import type { FilesManifest } from './t.manifest.ts';

/**
 * Files Cmd grammar.
 */
export declare namespace FilesCmd {
  /** Cmd namespace used when sharing a generic transport. */
  export type Namespace = 'sys.files';

  /** Runtime command names and namespace. */
  export type Lib = {
    readonly ns: Namespace;
    readonly Name: NameMap;
  };

  /** Command name value object. */
  export type NameMap = {
    readonly capabilities: Name.Capabilities;
    readonly list: Name.List;
    readonly stat: Name.Stat;
    readonly read: Name.Read;
    readonly watch: Name.Watch;
    readonly manifest: Name.Manifest;
  };

  /** Command names. */
  export type Name =
    | Name.Capabilities
    | Name.List
    | Name.Stat
    | Name.Read
    | Name.Watch
    | Name.Manifest;

  export namespace Name {
    export type Capabilities = 'files:capabilities';
    export type List = 'files:list';
    export type Stat = 'files:stat';
    export type Read = 'files:read';
    export type Watch = 'files:watch';
    export type Manifest = 'files:manifest';
  }

  /** Per-command payload map. */
  export type Payload = {
    readonly 'files:capabilities': Capabilities.Payload;
    readonly 'files:list': List.Payload;
    readonly 'files:stat': Stat.Payload;
    readonly 'files:read': Read.Payload;
    readonly 'files:watch': Watch.Payload;
    readonly 'files:manifest': Manifest.Payload;
  };

  /** Per-command result map. */
  export type Result = {
    readonly 'files:capabilities': Capabilities.Result;
    readonly 'files:list': List.Result;
    readonly 'files:stat': Stat.Result;
    readonly 'files:read': Read.Result;
    readonly 'files:watch': Watch.Result;
    readonly 'files:manifest': Manifest.Result;
  };

  /** Per-command streaming event map. */
  export type Event = {
    readonly 'files:capabilities': never;
    readonly 'files:list': never;
    readonly 'files:stat': never;
    readonly 'files:read': never;
    readonly 'files:watch': FilesChange.Change;
    readonly 'files:manifest': never;
  };

  /** Cmd handler map for a Files backing. */
  export type HandlerMap = t.Cmd.Handler.Map<Name, Payload, Result, Event>;

  /** Full Cmd client for the Files grammar. */
  export type Client = t.Cmd.Client.Handle<Name, Payload, Result, Event>;

  /** Unary-only Files Cmd client for transports without streaming fidelity. */
  export type UnaryClient = t.Cmd.Client.Unary<Name, Payload, Result>;

  /** Capabilities command. */
  export namespace Capabilities {
    export type Payload = Record<string, never>;
    export type Result = FilesCapability.Capabilities;
  }

  /** List command. */
  export namespace List {
    export type Payload = {
      /** Root-relative directory/scope. Defaults to root. */
      readonly path?: FilesBase.StringPath;

      /** Path/name selection. Glob-like; not shell syntax and not content search. */
      readonly match?: FilesBase.Match;

      /** Omit paths. Applied after policy. */
      readonly exclude?: FilesBase.Match;

      /** Bound traversal. */
      readonly depth?: FilesBase.Depth;

      /** Page size. */
      readonly limit?: FilesBase.Limit;

      /** Page cursor. */
      readonly cursor?: FilesCursor.List;
    };

    export type Result = {
      readonly entries: readonly FilesEntry.Entry[];
      readonly cursor?: FilesCursor.List;
      readonly truncated?: boolean;
    };
  }

  /** Stat command. */
  export namespace Stat {
    export type Payload = { readonly path: FilesBase.StringPath };
    export type Result = { readonly entry: FilesEntry.Entry };
  }

  /** Read command. */
  export namespace Read {
    export type Payload = {
      readonly path: FilesBase.StringPath;
      readonly encoding?: FilesBase.Encoding;
      readonly maxBytes?: t.NumberBytes;
    };

    export type Result = InlineResult | RefResult;

    export type InlineResult = {
      readonly kind: 'inline';
      readonly file: FilesEntry.File;
      readonly encoding: FilesBase.Encoding;
      readonly content: string;
      readonly truncated?: boolean;
    };

    export type RefResult = {
      readonly kind: 'ref';
      readonly file: FilesEntry.File;
      readonly contentRef: FilesContentRef.ContentRef;
    };
  }

  /** Watch command. */
  export namespace Watch {
    export type Payload = {
      /** Root-relative directory/scope. Defaults to root. */
      readonly path?: FilesBase.StringPath;

      /** Path/name selection. */
      readonly match?: FilesBase.Match;

      /** Omit paths. Applied after policy. */
      readonly exclude?: FilesBase.Match;

      /** Resume after a known sequence, when supported. */
      readonly since?: FilesBase.Seq;
    };

    export type Result = {
      readonly ok: true;
      readonly cursor?: FilesCursor.Watch;
    };
  }

  /** Manifest command. */
  export namespace Manifest {
    export type Payload = {
      /** Root-relative directory/scope. Defaults to root. */
      readonly path?: FilesBase.StringPath;

      /** Path/name selection. */
      readonly match?: FilesBase.Match;

      /** Omit paths. Applied after policy. */
      readonly exclude?: FilesBase.Match;

      /** Bound traversal. */
      readonly depth?: FilesBase.Depth;

      /** Include content refs when available. */
      readonly content?: boolean;

      /** Page size. */
      readonly limit?: FilesBase.Limit;

      /** Page cursor. */
      readonly cursor?: FilesCursor.Manifest;
    };

    export type Result = FilesManifest.Manifest;
  }
}
