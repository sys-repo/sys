import type { t } from './common.ts';

/** The tool's commands */
export type ClipboardCopyAction = 'types' | 'files:select' | 'files:all' | 'files:deno.json';

/**
 * CLI helpers for copying LLM friendly
 * text-file content to the clipboard.
 */
export type ClipboardToolsLib = {
  /** Run the interactive CLI flow (prompts + spinner). */
  cli(cwd?: t.StringDir, argv?: string[]): Promise<void>;
};

/**
 * Command line arguments (argv).
 */
export type ClipboardCliArgs = t.ToolsCliArgs;
