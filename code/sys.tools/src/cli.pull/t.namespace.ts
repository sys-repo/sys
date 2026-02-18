import type { t } from './common.ts';

/**
 * The Pull type namespace.
 */
export namespace PullTool {
  export const ID = 'pull' as const;
  export const NAME = 'system/pull:tools' as const;
  export type Id = typeof ID;
  export type Name = typeof NAME;

  /** CLI sub-commands (first positional token). */
  export type SubCmd = 'foo' | 'bar';
  export type TemplateVariant = 'stateless' | 'yaml';
  /** Command names. */
  export type MenuCmd =
    | 'init'
    | 'help'
    | 'option-a'
    | 'option-a:stateless'
    | 'option-a:yaml'
    | 'config'
    | 'back'
    | 'exit';
  export type MenuOption = { readonly name: string; readonly value: MenuCmd };

  /** Command line arguments (argv). */
  export type CliArgs = t.Tools.CliArgs;
  export type CliParsedArgs = t.ParsedArgs<CliArgs> & { readonly command?: SubCmd };
  // [tmpl:variant.types]
  export namespace ConfigYaml {
    export type Doc = { name: string };
    export type DirName = `-config/${string}.${Id}`;
    export type Ext = '.yaml';
    export type YamlCheck =
      | { readonly ok: true; readonly doc: Doc }
      | { readonly ok: false; readonly errors: readonly t.Schema.Error[] };
  }
}
