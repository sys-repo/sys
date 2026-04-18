import type { t } from './common.ts';

/**
 * The `@sys/tools/code` namespace.
 */
export namespace CodeTool {
  export const ID = 'code' as const;
  export const NAME = 'system/code:tools' as const;
  export type Id = typeof ID;
  export type Name = typeof NAME;

  /** Command line arguments (argv). */
  export type CliArgs = t.Tools.CliArgs;
  export type CliParsedArgs = t.ParsedArgs<CliArgs>;
}
