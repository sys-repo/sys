import type { t } from './common.ts';

/**
 * CLI helpers for working with __NAME__.
 */
export type __NAME__ToolsLib = {
  /** Run the interactive CLI flow (prompts + spinner). */
  cli(cwd?: t.StringDir, argv?: string[]): Promise<void>;
};

/**
 * The __NAME__ type namespace.
 */
export namespace __NAME__Tool {
  /** Command names */
  export type Command =
    | 'option-a'
    | 'option-b'
    | 'option-aa'
    | 'option-ab'
    | 'option-ba'
    | 'option-bb'
    | 'quit';

  /** Command line arguments (argv). */
  export type CliArgs = t.ToolsCliArgs;
  export type CliParsedArgs = t.ParsedArgs<CliArgs>;

  /** Configuration File */
  export type Config = t.JsonFile<__NAME__Tool.ConfigDoc>;
  export type ConfigDoc = t.JsonFileDoc & {
    name: string;
  };
}
