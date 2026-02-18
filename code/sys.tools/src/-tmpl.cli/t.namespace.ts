import type { t } from './common.ts';

/**
 * The __NAME__ type namespace.
 */
export namespace __NAME__Tool {
  export const ID = '__NAME__' as const;
  export const NAME = 'system/__NAME__:tools' as const;
  export type Id = typeof ID;
  export type Name = typeof NAME;

  /** CLI sub-commands (first positional token). */
  export type SubCmd = 'foo' | 'bar';
  /** Command names. */
  export type MenuCmd =
    | 'init'
    | 'help'
    | 'option-a'
    | 'option-b'
    | 'option-aa'
    | 'option-ab'
    | 'option-ba'
    | 'option-bb'
    | 'back'
    | 'exit';
  export type MenuOption = { readonly name: string; readonly value: MenuCmd };

  /** Command line arguments (argv). */
  export type CliArgs = t.Tools.CliArgs;
  export type CliParsedArgs = t.ParsedArgs<CliArgs> & { readonly command?: SubCmd };
}
