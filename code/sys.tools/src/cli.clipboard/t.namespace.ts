import type { t } from './common.ts';

/**
 * The `@sys/tools/copy` (clipboard) namepsace.
 */
export namespace ClipboardTool {
  export const ID = 'copy' as const;
  export const NAME = 'system/copy:tools' as const;
  export type Id = typeof ID;
  export type Name = typeof NAME;

  /** Command names. */
  export type Command = 'types' | 'files:select' | 'files:all' | 'files:deno.json';
  export type MenuOption = { name: string; value: Command };

  /** Command line arguments (argv). */
  export type CliArgs = t.Tools.CliArgs;
  export type CliParsedArgs = t.ParsedArgs<CliArgs>;
}
