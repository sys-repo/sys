import type { t } from './common.ts';

/**
 * CLI helpers for copying LLM friendly
 * text-file content to the clipboard.
 */
export type ClipboardLib = {
  /** Run the interactive CLI flow (prompts + spinner). */
  cli(opts?: { dir?: t.StringDir }): Promise<void>;
};
