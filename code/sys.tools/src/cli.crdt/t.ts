import type { t } from './common.ts';

/**
 * Exports:
 */
export type * from './cmd.repo.daemon/t.ts';
export type * from './cmd.graph/t.ts';
export type * from './cmd.snapshot/t.ts';

/** The tool's commands */
export type CrdtCommand =
  | 'snapshot'
  | 'doc:add'
  | 'doc:remove'
  | 'doc:lint'
  | 'doc:graph'
  | 'doc:viewer:yaml'
  | 'doc:config:print'
  | 'doc:tmpl:hookfile'
  | 'repo:daemon:start'
  | 'sync-server:start'
  | 'quit'
  | 'tmp:🐷';

/**
 * CLI helpers for working with CRDT documents.
 */
export type CrdtToolsLib = {
  /** Run the interactive CLI flow (prompts + spinner). */
  cli(cwd?: t.StringDir, argv?: string[]): Promise<void>;
};

/**
 * Command line arguments (argv).
 */
export type CrdtCliArgs = t.ToolsCliArgs;

/**
 * Config File
 */
export type CrdtConfig = t.JsonFile<CrdtConfigDoc>;
export type CrdtConfigDoc = t.JsonFileDoc & {
  version: string;
  docs?: t.CrdtConfigDocumentEntry[];
  repo: t.CrdtConfigRepo;
};

/**
 * Documents:
 */
export type CrdtConfigDocumentEntry = {
  id: t.StringId;
  name?: t.StringName;
  createdAt?: t.UnixTimestamp;
};

/**
 * Repositories:
 */
export type CrdtConfigRepo = { daemon: CrdtConfigRepoDaemon };
export type CrdtConfigRepoDaemon = {
  sync: { websockets: [] };
};
