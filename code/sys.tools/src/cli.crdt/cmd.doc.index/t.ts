import type { t } from '../common.ts';

export namespace CrdtIndex {
  /**
   * Subdirectory of the CLI `cwd`.
   * - '.' means the cwd itself.
   * - Otherwise a relative subpath (no leading '/'), never contains '..'.
   */
  export type Subdir = '.' | t.StringPath;

  /** Configuration file. */
  export namespace Config {
    /**
     * Per-document index configuration.
     * Keeps each index domain honest (fs, etc.) and scoped to the document entry.
     */
    export type Indexes = {
      /** Directory indexing dirs. */
      'fs:dirs'?: DirIndexes;
    };

    /**
     * Filesystem directory index configuration.
     */
    export type DirIndexes = {
      /** Directory roots indexed into this document. */
      dirs?: DirIndexEntry[];
    };

    /**
     * Entry filter.
     * Extensions are stored without leading '.' and lowercase.
     */
    export type DirIndexFilter = {
      /** Extension allow-list. If present/non-empty, only these are included. */
      includeExt?: string[];

      /** Extension deny-list applied after include. */
      excludeExt?: string[];
    };

    export type DirIndexEntry = {
      /**
       * CWD-relative subdir (portable).
       * Use '.' for the cwd itself.
       */
      subdir: Subdir;

      /**
       * Document-local mount path (under the indexer’s root) where this dir’s
       * indexed data is written.
       *
       * Example: ['fs:index:dir'] or ['foo', 'bar'] meaning: <docRoot>/<...>/foo/bar
       *
       * NOTE: This mount is treated as the unique identity key for selection.
       */
      mount?: t.ObjectPath;

      /** UX metadata. */
      createdAt?: t.UnixTimestamp;
      lastUsedAt?: t.UnixTimestamp;

      /** Optional filter that shapes what gets indexed for this entry. */
      filter?: DirIndexFilter;
    };
  }

  /** Filesystem index types. */
  export namespace Fs {
    /**
     * Snapshot filter (what shaped the built payload).
     * Ext filter is shared with config; globs are snapshot-only (for now).
     */
    export type Filter = CrdtIndex.Config.DirIndexFilter & {
      includeGlob?: string[];
      excludeGlob?: string[];
    };

    /**
     * Filesystem index materialized into the CRDT at a chosen mount path.
     *
     * Design:
     * - Store as a *flat key-value map* keyed by normalized, mount-relative path.
     * - Re-index is a simple reconciliation: delete missing keys, upsert present.
     * - Tree views are derived at read-time (optional), not stored.
     */
    export type Snapshot = {
      readonly kind: 'fs:index';
      readonly version: 1;

      /**
       * Source info used to build this index.
       * (Useful for debugging and for knowing what a mount "means".)
       */
      readonly source: IndexSource;

      /** Run metadata. */
      readonly meta?: IndexMeta;

      /**
       * Flat map of entries keyed by normalized relative path (POSIX '/').
       * Example keys: 'README.md', 'src/mod.ts', 'assets/logo.png'
       */
      readonly entries: { readonly [relPath: string]: FsIndexEntry };
    };

    export type IndexSource = {
      /**
       * The configured index root that was scanned.
       * '.' means cwd itself, otherwise a cwd-relative subpath.
       */
      readonly subdir: Subdir;

      /**
       * Optional include/exclude patterns that shaped the index.
       * Keep this small and declarative; it is not required for reconciliation.
       */
      readonly filter?: Filter;
    };

    export type IndexMeta = {
      readonly createdAt?: t.UnixTimestamp;
      readonly updatedAt?: t.UnixTimestamp;
      readonly counts?: {
        readonly files?: number;
        readonly dirs?: number;
        readonly bytes?: number;
      };
    };

    /**
     * Tier-1 entry metadata: cheap + stable.
     * (Hashing/snippets/embeddings are tier-2+ and should live elsewhere.)
     */
    export type FsIndexEntry = {
      readonly kind: 'file' | 'dir';
      readonly ext?: string;
      readonly bytes?: number;
      readonly mtime?: t.UnixTimestamp;
    };
  }
}
