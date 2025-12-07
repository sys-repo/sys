import type { t } from './common.ts';

/**
 * Re-exports:
 */
export type * from './cmd.doc.graph/t.ts';
export type * from './cmd.doc.snapshot/t.ts';
export type * from './cmd.repo.daemon/t.ts';

/**
 * CLI helpers for working with CRDT documents.
 */
export type CrdtToolsLib = {
  /** Run the interactive CLI flow (prompts + spinner). */
  cli(cwd?: t.StringDir, argv?: string[]): Promise<void>;
};

/**
 * The `@sys/tools/crdt` type namespace.
 */
export namespace CrdtTool {
  /** Command names */
  export type Command =
    | 'snapshot'
    | 'doc:add'
    | 'doc:remove'
    | 'doc:lint'
    | 'doc:graph:walk'
    | 'doc:graph:dag'
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
  export type CliArgs = t.ToolsCliArgs;

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
  };

  /**
   * Repositories:
   */
  export type ConfigRepo = { daemon: ConfigRepoDaemon };
  export type ConfigRepoDaemon = {
    sync: { websockets: [] };
  };
}
