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
  export type Id = 'fs';
  export type Name = 'system/fs:tools';

  /** Command names */
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
