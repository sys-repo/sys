import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.namespace.ts';
export type * from './t.copyPlan.ts';

/**
 * CLI helpers for copying LLM friendly
 * text-file content to the clipboard.
 */
export type ClipboardToolsLib = {
  /** Run the interactive CLI flow (prompts + spinner). */
  cli(cwd?: t.StringDir, argv?: string[]): Promise<void>;
};
