import type { t } from './common.ts';

/**
 * The Crypto type namespace.
 */
export namespace CryptoTool {
  export const ID = 'crypto' as const;
  export const NAME = 'system/crypto:tools' as const;
  export type Id = typeof ID;
  export type Name = typeof NAME;

  /** CLI sub-commands (first positional token). */
  export type SubCmd = 'hash';
  export type TemplateVariant = 'stateless' | 'yaml';
  /** Command names. */
  export type MenuCmd =
    | 'init'
    | 'help'
    | 'hash:cwd'
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
