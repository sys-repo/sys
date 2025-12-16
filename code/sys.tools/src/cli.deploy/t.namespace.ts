import type { t } from './common.ts';

/**
 * The Deploy type namespace.
 */
export namespace DeployTool {
  export type Id = 'deploy';
  export type Name = 'system/deploy:tools';

  /** Command names */
  export type Command =
    | 'option-a'
    | 'option-b'
    | 'option-aa'
    | 'option-ab'
    | 'option-ba'
    | 'option-bb'
    | 'exit';
  export type MenuOption = { name: string; value: Command };

  /** Command line arguments (argv). */
  export type CliArgs = t.Tools.CliArgs;
  export type CliParsedArgs = t.ParsedArgs<CliArgs>;

  /** Configuration file. */
  export namespace Config {
    export type File = t.JsonFile<Doc>;
    export type Doc = t.JsonFileDoc & {
      name: string;
    };
  }
}
