import type { t } from './common.ts';

export type * from './cmd.snapshot/t.ts';

/** The various copy options */
export type CrdtCommand = 'modify:add' | 'modify:remove' | 'snapshot';

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
  docs?: CrdtConfigDocEntry[];
};

export type CrdtConfigDocEntry = {
  id: t.StringId;
  name?: t.StringName;
  createdAt?: t.UnixTimestamp;
};
