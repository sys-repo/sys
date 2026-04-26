import type { t } from '../common.ts';

/**
 * The Tmpl tool namespace.
 */
export namespace TmplTool {
  export const ID = 'tmpl' as const;
  export const NAME = 'system/tmpl:tools' as const;
  export type Id = typeof ID;
  export type Name = typeof NAME;

  /** Command line arguments (argv). */
  export type CliArgs = t.Tools.CliArgs;
  export type CliParsedArgs = t.ParsedArgs<CliArgs>;
}

/**
 * CLI helpers for the thin `@sys/tools/tmpl` wrapper.
 */
export type TmplToolsLib = {
  /** Delegate to `@sys/tmpl` with passthrough argv/cwd semantics. */
  cli(cwd?: t.StringDir, argv?: string[]): Promise<void>;
};
