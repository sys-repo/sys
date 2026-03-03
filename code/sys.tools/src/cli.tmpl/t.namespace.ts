import type { t } from './common.ts';

/**
 * The Tmpl type namespace.
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
