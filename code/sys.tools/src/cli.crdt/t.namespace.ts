import type { t } from './common.ts';

/**
 * The `@sys/tools/crdt` type namespace.
 */
export namespace CrdtTool {
  export type Id = 'crdt';
  export type Name = 'system/crdt:tools';

  /** Command names */
  export type Command =
    | 'snapshot'
    | 'doc:add'
    | 'doc:remove'
    | 'doc:graph:walk'
    | 'doc:graph:dag'
    | 'doc:graph:lint'
    | 'doc:graph:tasks'
    | 'doc:fs:index:dir'
    | 'doc:viewer:yaml'
    | 'doc:config:print'
    | 'doc:tmpl:hookfile'
    | 'repo:daemon:start'
    | 'repo:syncserver:start'
    | 'exit'
    | 'tmp:🐷';

  /**
   * Command line arguments (argv).
   */
  export type CliArgs = t.Tools.CliArgs;

  /**
   * Config File
   */
  export type Config = t.JsonFile<ConfigDoc>;
  export type ConfigDoc = t.JsonFileDoc & {
    version: string;
    docs?: ConfigDocumentEntry[];
    repo: ConfigRepo;
  };

  /**
   * Documents:
   */
  export type ConfigDocumentEntry = {
    id: t.StringId;
    name?: t.StringName;
    createdAt?: t.UnixTimestamp;
    lastUsedAt?: t.UnixTimestamp;
    lint?: { facets?: string[] };

    /** Per-document indexes (optional). */
    indexes?: CrdtTool.Indexes;
  };

  /**
   * Filesystem directory index configuration.
   */
  export type Indexes = t.CrdtIndexes;
  export type DirIndexes = t.CrdtDirIndexes;
  export type Subdir = t.Subdir;
  export type DirIndexEntry = t.CrdtDirIndexEntry;

  /**
   * Repositories:
   */
  export type ConfigRepo = { daemon: ConfigRepoDaemon };
  export type ConfigRepoDaemon = { sync: { websockets: [] } };
}
