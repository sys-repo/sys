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

  /** Command line arguments (argv). */
  export type CliArgs = t.Tools.CliArgs;
  export type CliParsedArgs = t.ParsedArgs<CliArgs>;

  /** Document related types. */
  export namespace Doc {
    /** Document-graph types. */
    export namespace Graph {
      export type DagHook = t.DocumentGraphDagHook;
      export type WalkHook = t.DocumentGraphWalkHook;
    }
    /** Document linting types. */
    export namespace Lint {
      export type Issue<K extends string = string> = t.DocLintIssue<K>;
      export type Result<K extends string = string> = t.DocLintResult<K>;
      export type Severity = t.LintSeverity;
    }
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
    export type DocumentEntry = {
      id: t.StringId;
      name?: t.StringName;
      createdAt?: t.UnixTimestamp;
      lastUsedAt?: t.UnixTimestamp;
      lint?: { facets?: string[] };

      /** Per-document indexes (optional). */
      indexes?: Indexes;
    };

    /**
     * Config: Filesystem directory index configuration.
     */
    export type Indexes = t.CrdtIndexes;
    export type DirIndexes = t.CrdtDirIndexes;
    export type Subdir = t.Subdir;
    export type DirIndexEntry = t.CrdtDirIndexEntry;

    /**
     * Config: Repositories.
     */
    export type Repo = { daemon: RepoDaemon };
    export type RepoDaemon = { sync: { websockets: [] } };
  }
}
