import type { t } from './common.ts';

/** The various copy options */
export type UpdateCommand = 'update';
// | 'hash:tidy-sha256-files'
// | 'hash:remove-renamed-sha256'
// | 'hash:list';

/**
 * CLI helpers for updating the locally installed
 * `@sys/tools` module itself (self:reflective).
 */
export type UpdateToolsLib = {
  /** Run the interactive CLI flow (prompts + spinner). */
  cli(opts?: { dir?: t.StringDir; argv?: string[] }): Promise<void>;
};

/**
 * Command line arguments (argv).
 */
export type UpdateCliArgs = t.ToolsCliArgs;
