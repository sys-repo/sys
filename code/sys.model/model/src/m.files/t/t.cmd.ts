import type { t } from '../common.ts';
import type { FilesCapability } from './t.capability.ts';
import type { FilesChange } from './t.change.ts';
import type { FilesContentRef } from './t.content-ref.ts';
import type { Core } from './t.u.core.ts';
import type { FilesCursor } from './t.cursor.ts';
import type { FilesEntry } from './t.entry.ts';
import type { FilesManifest } from './t.manifest.ts';

/**
 * Files Cmd grammar.
 */
export declare namespace FilesCmd {
  /** Runtime command names and namespace. */
  export type Lib = {
    /** Cmd namespace used when sharing a generic transport. */
    readonly ns: Namespace;
    /** Runtime command names. */
    readonly Name: NameMap;
  };

  /** Cmd namespace used when sharing a generic transport. */
  export type Namespace = 'sys.files';

  /** Command name value object. */
  export type NameMap = {
    /** Capabilities command name. */
    readonly capabilities: Name.Capabilities;
    /** List command name. */
    readonly list: Name.List;
    /** Stat command name. */
    readonly stat: Name.Stat;
    /** Read command name. */
    readonly read: Name.Read;
    /** Write command name. */
    readonly write: Name.Write;
    /** Remove command name. */
    readonly remove: Name.Remove;
    /** Watch command name. */
    readonly watch: Name.Watch;
    /** Manifest command name. */
    readonly manifest: Name.Manifest;
  };

  /** Command names. */
  export type Name =
    | Name.Capabilities
    | Name.List
    | Name.Stat
    | Name.Read
    | Name.Write
    | Name.Remove
    | Name.Watch
    | Name.Manifest;

  export namespace Name {
    /** Capabilities command name. */
    export type Capabilities = 'files:capabilities';
    /** List command name. */
    export type List = 'files:list';
    /** Stat command name. */
    export type Stat = 'files:stat';
    /** Read command name. */
    export type Read = 'files:read';
    /** Write command name. */
    export type Write = 'files:write';
    /** Remove command name. */
    export type Remove = 'files:remove';
    /** Watch command name. */
    export type Watch = 'files:watch';
    /** Manifest command name. */
    export type Manifest = 'files:manifest';
  }

  /** Per-command payload map. */
  export type Payload = {
    /** Capabilities payload. */
    readonly 'files:capabilities': Capabilities.Payload;
    /** List payload. */
    readonly 'files:list': List.Payload;
    /** Stat payload. */
    readonly 'files:stat': Stat.Payload;
    /** Read payload. */
    readonly 'files:read': Read.Payload;
    /** Write payload. */
    readonly 'files:write': Write.Payload;
    /** Remove payload. */
    readonly 'files:remove': Remove.Payload;
    /** Watch payload. */
    readonly 'files:watch': Watch.Payload;
    /** Manifest payload. */
    readonly 'files:manifest': Manifest.Payload;
  };

  /** Per-command result map. */
  export type Result = {
    /** Capabilities result. */
    readonly 'files:capabilities': Capabilities.Result;
    /** List result. */
    readonly 'files:list': List.Result;
    /** Stat result. */
    readonly 'files:stat': Stat.Result;
    /** Read result. */
    readonly 'files:read': Read.Result;
    /** Write result. */
    readonly 'files:write': Write.Result;
    /** Remove result. */
    readonly 'files:remove': Remove.Result;
    /** Watch result. */
    readonly 'files:watch': Watch.Result;
    /** Manifest result. */
    readonly 'files:manifest': Manifest.Result;
  };

  /** Per-command streaming event map. */
  export type Event = {
    /** Capabilities events. */
    readonly 'files:capabilities': never;
    /** List events. */
    readonly 'files:list': never;
    /** Stat events. */
    readonly 'files:stat': never;
    /** Read events. */
    readonly 'files:read': never;
    /** Write events. */
    readonly 'files:write': never;
    /** Remove events. */
    readonly 'files:remove': never;
    /** Watch events. */
    readonly 'files:watch': FilesChange.Change;
    /** Manifest events. */
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
    /** Capabilities request payload. */
    export type Payload = Record<string, never>;
    /** Capability facts for the bounded Files view. */
    export type Result = FilesCapability.Capabilities;
  }

  /** List command. */
  export namespace List {
    /** List request payload. */
    export type Payload = {
      /** Root-relative directory/scope; defaults to root. */
      readonly path?: Core.StringPath;
      /** Path/name selection; glob-like, not shell syntax. */
      readonly match?: Core.Match;
      /** Omit paths after policy filtering. */
      readonly exclude?: Core.Match;
      /** Traversal depth bound. */
      readonly depth?: Core.Depth;
      /** Page size. */
      readonly limit?: Core.Limit;
      /** Page cursor. */
      readonly cursor?: FilesCursor.List;
    };

    /** List result. */
    export type Result = {
      /** Visible entries. */
      readonly entries: readonly FilesEntry.Entry[];
      /** Cursor for additional list pages. */
      readonly cursor?: FilesCursor.List;
      /** True when the result is intentionally partial. */
      readonly truncated?: boolean;
    };
  }

  /** Stat command. */
  export namespace Stat {
    /** Stat request payload. */
    export type Payload = { readonly path: Core.StringPath };
    /** Stat result. */
    export type Result = { readonly entry: FilesEntry.Entry };
  }

  /** Read command. */
  export namespace Read {
    /** Read request payload. */
    export type Payload = {
      /** Root-relative file path. */
      readonly path: Core.StringPath;
      /** Requested text encoding. */
      readonly encoding?: Core.Encoding;
      /** Caller-requested maximum bytes. */
      readonly maxBytes?: t.NumberBytes;
    };

    /** Read result. */
    export type Result = InlineResult | RefResult;

    /** Inline text read result. */
    export type InlineResult = {
      /** Result kind. */
      readonly kind: 'inline';
      /** File metadata. */
      readonly file: FilesEntry.File;
      /** Text encoding. */
      readonly encoding: Core.Encoding;
      /** Inline file content. */
      readonly content: string;
      /** True when content is intentionally partial. */
      readonly truncated?: boolean;
    };

    /** Content-reference read result. */
    export type RefResult = {
      /** Result kind. */
      readonly kind: 'ref';
      /** File metadata. */
      readonly file: FilesEntry.File;
      /** Portable content reference. */
      readonly contentRef: FilesContentRef.ContentRef;
    };
  }

  /** Write command. */
  export namespace Write {
    /** Write request payload. */
    export type Payload = TextPayload | BytesPayload;

    /** Complete text-file value write. Not a patch/edit operation. */
    export type TextPayload = {
      /** Write payload kind. */
      readonly kind: 'text';
      /** Root-relative file path. */
      readonly path: Core.StringPath;
      /** Complete text content to write. */
      readonly content: string;
      /** Text encoding. */
      readonly encoding?: Core.Encoding;
      /** Media/content type, when known by the caller. */
      readonly mediaType?: t.StringMimeType;
    };

    /** Complete binary-file value write. Not a JSON transport shape. */
    export type BytesPayload = {
      /** Write payload kind. */
      readonly kind: 'bytes';
      /** Root-relative file path. */
      readonly path: Core.StringPath;
      /** Complete binary content to write. */
      readonly content: Uint8Array;
      /** Media/content type, when known by the caller. */
      readonly mediaType?: t.StringMimeType;
    };

    /** Write result. */
    export type Result = {
      /** Change kind produced by the write. */
      readonly kind: 'created' | 'modified';
      /** Root-relative file path written. */
      readonly path: Core.StringPath;
      /** File metadata, when returned by the backing. */
      readonly entry?: FilesEntry.File;
      /** Monotonic sequence number, when provided by the backing. */
      readonly seq?: Core.Seq;
    };
  }

  /** Remove command. */
  export namespace Remove {
    /** Remove request payload. */
    export type Payload = {
      /** Root-relative file or directory path. */
      readonly path: Core.StringPath;
      /** Allow recursive directory removal. */
      readonly recursive?: boolean;
    };

    /** Remove result. */
    export type Result = {
      /** Change kind produced by the remove. */
      readonly kind: 'deleted';
      /** Root-relative path removed. */
      readonly path: Core.StringPath;
      /** Monotonic sequence number, when provided by the backing. */
      readonly seq?: Core.Seq;
    };
  }

  /** Watch command. */
  export namespace Watch {
    /** Watch request payload. */
    export type Payload = {
      /** Root-relative directory/scope; defaults to root. */
      readonly path?: Core.StringPath;
      /** Path/name selection. */
      readonly match?: Core.Match;
      /** Omit paths after policy filtering. */
      readonly exclude?: Core.Match;
      /** Resume after a known sequence, when supported. */
      readonly since?: Core.Seq;
    };

    /** Watch result. */
    export type Result = {
      /** True when the watch subscription ended cleanly. */
      readonly ok: true;
      /** Cursor for resuming from the last observed change. */
      readonly cursor?: FilesCursor.Watch;
    };
  }

  /** Manifest command. */
  export namespace Manifest {
    /** Manifest request payload. */
    export type Payload = {
      /** Root-relative directory/scope; defaults to root. */
      readonly path?: Core.StringPath;
      /** Path/name selection. */
      readonly match?: Core.Match;
      /** Omit paths after policy filtering. */
      readonly exclude?: Core.Match;
      /** Traversal depth bound. */
      readonly depth?: Core.Depth;
      /** Include content refs when available. */
      readonly content?: boolean;
      /** Page size. */
      readonly limit?: Core.Limit;
      /** Page cursor. */
      readonly cursor?: FilesCursor.Manifest;
    };

    /** Manifest result. */
    export type Result = FilesManifest.Manifest;
  }
}
