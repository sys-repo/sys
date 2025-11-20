import type { t } from './common.ts';

/** The various copy options */
export type CrdtCommand = 'snapshot';

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
export type CrdtConfigDoc = t.JsonFileDoc & { version: string };
