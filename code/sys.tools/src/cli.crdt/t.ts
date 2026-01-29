import type { t } from './common.ts';

/** Type re-exports. */
export type * from './cmd.doc.graph/t.ts';
export type * from './cmd.doc.snapshot/t.ts';
export type * from './cmd.repo.daemon/t.ts';
export type * from './t.namespace.ts';

/**
 * CLI helpers for working with CRDT documents.
 */
export type CrdtToolsLib = {
  /** Run the interactive CLI flow (prompts + spinner). */
  cli(cwd?: t.StringDir, argv?: string[]): Promise<void>;
};
