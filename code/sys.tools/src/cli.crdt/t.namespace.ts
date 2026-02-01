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
    | 'root:tmpl:hookfile'
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

  /** Root-level hook types. */
  export namespace Hook {
    export type Module = t.RootHookModule;
    export type Plugin = t.RootHookPlugin;
    export type PluginResult = t.RootHookPluginResult;
    export type PluginResultKind = t.RootHookPluginResultKind;
  }

  /**
   * YAML-authored document configuration (authoritative).
   */
  export namespace DocumentYaml {
    /** YAML document structure for a tracked CRDT document. */
    export type Doc = {
      /** Document identifier. */
      id: t.StringId;
      /** Optional display name. */
      name?: t.StringName;
    };

    /** Filesystem conventions for document YAML storage. */
    export type DirName = `-config/${string}/crdt/docs`;
    export type Ext = '.yaml';
    export type YamlCheck =
      | { readonly ok: true; readonly doc: Doc }
      | { readonly ok: false; readonly errors: readonly t.Schema.Error[] };
  }

  /** YAML-authored repo configuration (authoritative). */
  export namespace RepoYaml {
    /** Sync endpoint entry. */
    export type SyncItem = {
      endpoint: string;
      enabled?: boolean;
    };

    /** YAML document structure for repo configuration. */
    export type Doc = {
      /** Sync websocket endpoints. */
      sync: SyncItem[];
      /** Port configuration. */
      ports?: {
        repo?: number;
        sync?: number;
      };
    };

    /** Filesystem conventions for repo YAML storage. */
    export type DirName = `-config/${string}/crdt`;
    export type Ext = '.yaml';
    export type YamlCheck =
      | { readonly ok: true; readonly doc: Doc }
      | { readonly ok: false; readonly errors: readonly t.Schema.Error[] };
  }
}
