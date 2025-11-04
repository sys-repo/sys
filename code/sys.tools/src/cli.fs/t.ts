import type { t } from './common.ts';

/** The various copy options */
export type FsCommand =
  | 'hash:rename-sha256'
  | 'hash:tidy-sha256-files'
  | 'hash:remove-renamed-sha256'
  | 'hash:list';

/**
 * CLI helpers for performing common file-system tasks.
 */
export type FsToolsLib = {
  /** Run the interactive CLI flow (prompts + spinner). */
  cli(opts?: { dir?: t.StringDir; argv?: string[] }): Promise<void>;
};

/**
 * Command line arguments (argv).
 */
export type FsCliArgs = t.ToolsCliArgs;
