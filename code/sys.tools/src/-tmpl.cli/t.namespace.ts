import type { t } from './common.ts';

/**
 * The __NAME__ type namespace.
 */
export namespace __NAME__Tool {
  export const ID = '__NAME__' as const;
  export const NAME = 'system/__NAME__:tools' as const;
  export type Id = typeof ID;
  export type Name = typeof NAME;

  /** Command names. */
  export type Command =
    | 'option-a'
    | 'option-b'
    | 'option-aa'
    | 'option-ab'
    | 'option-ba'
    | 'option-bb'
    | 'exit';
  export type MenuOption = { readonly name: string; readonly value: Command };

  /** Command line arguments (argv). */
  export type CliArgs = t.Tools.CliArgs;
  export type CliParsedArgs = t.ParsedArgs<CliArgs>;

  /** Configuration file. */
  export namespace Config {
    export type File = t.JsonFile<Doc>;
    export type Doc = t.JsonFileDoc & { name: string };
  }
}
