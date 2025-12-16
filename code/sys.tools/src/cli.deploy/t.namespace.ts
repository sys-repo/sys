import type { t } from './common.ts';

/**
 * CLI helpers for working with Deploy.
 */
export type DeployToolsLib = {
  /** Run the interactive CLI flow (prompts + spinner). */
  cli(cwd?: t.StringDir, argv?: string[]): Promise<void>;
};

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

  /** Configuration file */
  export type Config = t.JsonFile<DeployTool.ConfigDoc>;
  export type ConfigDoc = t.JsonFileDoc & {
    name: string;
  };
}
