import type { FilesBase } from './t/t.base.ts';
import type { FilesCapability } from './t/t.capability.ts';
import type { FilesChange } from './t/t.change.ts';
import type { FilesCmd } from './t/t.cmd.ts';
import type { FilesContentRef } from './t/t.content-ref.ts';
import type { FilesCursor } from './t/t.cursor.ts';
import type { FilesEntry } from './t/t.entry.ts';
import type { FilesManifest } from './t/t.manifest.ts';
import type { FilesPolicy } from './t/t.policy.ts';

export type { FilesCapability } from './t/t.capability.ts';
export type { FilesChange } from './t/t.change.ts';
export type { FilesCmd } from './t/t.cmd.ts';
export type { FilesContentRef } from './t/t.content-ref.ts';
export type { FilesCursor } from './t/t.cursor.ts';
export type { FilesEntry } from './t/t.entry.ts';
export type { FilesError } from './t/t.error.ts';
export type { FilesManifest } from './t/t.manifest.ts';
export type { FilesPolicy } from './t/t.policy.ts';
export type { FilesSource } from './t/t.source.ts';

/**
 * Bounded, transport-independent Files model.
 */
export declare namespace Files {
  // NOTE: Keep this root namespace narrow; detailed contracts live beside it.

  /** Namespace-style public runtime surface. */
  export type Lib = {
    /** Files Cmd grammar names and namespace. */
    readonly Cmd: FilesCmd.Lib;

    /** Cursor codec for paged Files command surfaces. */
    readonly Cursor: FilesCursor.Lib;

    /** Pure policy helpers for bounded Files views. */
    readonly Policy: FilesPolicy.Lib;
  };

  /** Stable client facade type for Files Cmd users. */
  export type Client = FilesCmd.Client;

  /** Canonical root-relative file path visible inside a bounded Files view. */
  export type StringPath = FilesBase.StringPath;

  /** Opaque, versioned cursor token for paged Files command surfaces. */
  export type StringCursor<
    K extends FilesCursor.Kind = FilesCursor.Kind,
    V extends FilesCursor.Version = FilesCursor.Version,
  > = FilesCursor.StringCursor<K, V>;

  /** Monotonic sequence number for change hints. */
  export type Seq = FilesBase.Seq;

  /** Non-negative traversal depth for list/manifest scopes. */
  export type Depth = FilesBase.Depth;

  /** Page-size limit for paged command surfaces. */
  export type Limit = FilesBase.Limit;

  /** Supported inline text encodings for first-land reads. */
  export type Encoding = FilesBase.Encoding;

  /** Path/name selector. Glob-like; not shell syntax and not content search. */
  export type Match = FilesBase.Match;

  /** Transport/backing fidelity class for a Files view. */
  export type Fidelity = FilesBase.Fidelity;

  /** File or directory entry visible inside a bounded Files view. */
  export type Entry = FilesEntry.Entry;

  /** Portable reference to file content outside an inline Cmd result. */
  export type ContentRef = FilesContentRef.ContentRef;

  /** Read-oriented capability name for a bounded Files view. */
  export type Capability = FilesCapability.Capability;

  /** Capability facts for a bounded Files view. */
  export type Capabilities = FilesCapability.Capabilities;

  /** Portable manifest for a bounded Files view. */
  export type Manifest = FilesManifest.Manifest;

  /** Change event hint. List/stat/read remain truth. */
  export type Change = FilesChange.Change;
}
