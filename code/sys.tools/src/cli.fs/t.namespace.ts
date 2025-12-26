import type { t } from './common.ts';

/** The tool's commands */
export type FsCommand =
  | 'hash:rename-sha256'
  | 'hash:tidy-sha256-files'
  | 'hash:remove-renamed-sha256'
  | 'hash:list';

/**
 * The `@sys/tools/fs` namespace.
 */
export namespace FsTool {
  export const ID = 'fs' as const;
  export const NAME = 'system/fs:tools' as const;
  export type Id = typeof ID;
  export type Name = typeof NAME;

  /** Command names. */
  export type Command =
    | 'hash:rename-sha256'
    | 'hash:tidy-sha256-files'
    | 'hash:remove-renamed-sha256'
    | 'hash:list';
  export type MenuOption = { name: string; value: Command };

  /** Command line arguments (argv). */
  export type CliArgs = t.Tools.CliArgs;
  export type CliParsedArgs = t.ParsedArgs<CliArgs>;
}
