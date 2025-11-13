import type { t } from './common.ts';

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
export type UpdateCliArgs = t.ToolsCliArgs & { latest?: boolean };

/**
 * Table of update versions
 */
export type UpdateVersionInfo = {
  readonly local: t.StringSemver;
  readonly remote: t.StringSemver;
  readonly latest: t.StringSemver;
  readonly is: { readonly latest: boolean };
};
