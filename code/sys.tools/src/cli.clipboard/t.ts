import type { t } from './common.ts';

/** The various copy options */
export type ClipboardCopyAction = 'types' | 'files:select' | 'files:all' | 'files:deno.json';

/**
 * CLI helpers for copying LLM friendly
 * text-file content to the clipboard.
 */
export type ClipboardToolsLib = {
  /** Run the interactive CLI flow (prompts + spinner). */
  cli(opts?: { dir?: t.StringDir; argv?: string[] }): Promise<void>;
};

/**
 * Command line arguments (argv).
 */
export type ClipboardCliArgs = { help: boolean };
