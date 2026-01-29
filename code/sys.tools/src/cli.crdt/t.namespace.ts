import type { t } from './common.ts';

/**
 * The `@sys/tools/crdt` type namespace.
 */
export namespace CrdtTool {
  export const ID = 'crdt' as const;
  export const NAME = 'system/crdt:tools' as const;
  export type Id = typeof ID;
  export type Name = typeof NAME;

  /** Command names. */
  export type Command =
    | 'snapshot'
    | 'doc:add'
    | 'doc:remove'
    | 'doc:rename'
    | 'doc:graph:walk'
    | 'doc:graph:dag'
    | 'doc:viewer:yaml'
    | 'doc:tmpl:hookfile'
    | 'repo:daemon:start'
    | 'repo:syncserver:start'
    | 'back'
    | 'exit'
    | 'tmp:🐷';

  /** Command line arguments (argv). */
  export type CliArgs = t.Tools.CliArgs;
  export type CliParsedArgs = t.ParsedArgs<CliArgs>;

  /** Document related types. */
  export namespace Doc {
    /** Document-graph types. */
    export namespace Graph {
      export type DagHook = t.DocumentGraphDagHook;
      export type WalkHook = t.DocumentGraphWalkHook;
      export type Plugin = t.DocumentGraphPlugin;
    }
  }

  /**
   * Materialized index payload types (data written into the CRDT).
   */
  export namespace Index {
    export namespace Fs {
      export type Snapshot = t.CrdtIndex.Fs.Snapshot;
      export type Source = t.CrdtIndex.Fs.IndexSource;
      export type Meta = t.CrdtIndex.Fs.IndexStats;
      export type Entry = t.CrdtIndex.Fs.FsIndexEntry;
    }
  }

  /**
   * YAML-authored document configuration (authoritative).
   */
  export namespace DocumentYaml {
    /**
     * YAML document structure for a tracked CRDT document.
     */
    export type Doc = {
      /** Document identifier. */
      id: t.StringId;
      /** Optional display name. */
      name?: t.StringName;
    };

    /**
     * Filesystem conventions for document YAML storage.
     */
    export type DirName = `-config/${string}/crdt/docs`;
    export type Ext = '.yaml';
    export type YamlCheck =
      | { readonly ok: true; readonly doc: Doc }
      | { readonly ok: false; readonly errors: readonly t.Schema.Error[] };
  }

  /**
   * YAML-authored repo configuration (authoritative).
   */
  export namespace RepoYaml {
    /**
     * YAML document structure for repo configuration.
     */
    export type Doc = {
      /** Sync websocket endpoints. */
      sync: string[];
    };

    /**
     * Filesystem conventions for repo YAML storage.
     */
    export type DirName = `-config/${string}/crdt`;
    export type Ext = '.yaml';
    export type YamlCheck =
      | { readonly ok: true; readonly doc: Doc }
      | { readonly ok: false; readonly errors: readonly t.Schema.Error[] };
  }

  /** Configuration file. */
  export namespace Config {
    export type File = t.JsonFile<Config.Doc>;
    export type Doc = t.JsonFileDoc & {
      version: string;
      docs?: Config.DocumentEntry[];
      repo: Config.Repo;
    };

    /**
     * Config: Documents.
     */
    export type DocumentEntry = t.Tools.Recency & {
      id: t.StringId;
      name?: t.StringName;

      /** Per-document indexes (optional). */
      indexes?: Indexes;
    };

    /**
     * Config: Filesystem directory index configuration.
     */
    export type Subdir = t.CrdtIndex.Subdir;
    export type Indexes = t.CrdtIndex.Config.Indexes;
    export type DirIndexes = t.CrdtIndex.Config.DirIndexes;
    export type DirIndexEntry = t.CrdtIndex.Config.DirIndexEntry;

    /**
     * Config: Repositories.
     */
    export type Repo = { daemon: RepoDaemon };
    export type RepoDaemon = { sync: { websockets: [] } };
  }
}
