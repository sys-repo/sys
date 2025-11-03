import type { t } from './common.ts';

/**
 * CLI helpers for working with CRDT documents.
 */
export type CrdtToolsLib = {
  /** Run the interactive CLI flow (prompts + spinner). */
  cli(opts?: { dir?: t.StringDir; argv?: string[] }): Promise<void>;
};

/**
 * Command line arguments (argv).
 */
export type CrdtCliArgs = { help: boolean };
