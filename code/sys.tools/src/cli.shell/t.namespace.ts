import type { Shell, t } from './common.ts';

type ShellLib = typeof Shell;

/**
 * The `@sys/tools/shell` namespace.
 */
export namespace ShellTool {
  export const ID = 'shell' as const;
  export const NAME = 'system/shell:tools' as const;
  export type Id = typeof ID;
  export type Name = typeof NAME;

  /** CLI sub-commands (first positional token). */
  export type Command = 'doctor';

  /** Command line arguments (argv). */
  export type CliArgs = t.Tools.CliArgs;
  export type CliParsedArgs = t.ParsedArgs<CliArgs> & { readonly command?: Command };
  export type CliContext = { readonly origin?: 'argv' | 'root-menu' };
  export type CliResult = void | { readonly kind: 'back' };

  /** POSIX-family dialects the shell planner can write today. */
  export type PosixDialect = NonNullable<Parameters<ShellLib['Block']['render']>[0]['dialect']>;
  /** Write support available for a shell dialect. */
  export type Support = 'write' | 'doctor-only' | 'unsupported';

  /** Managed block owner metadata. */
  export type Owner = Parameters<ShellLib['Block']['markers']>[0];
  /** Catalog entry shapes from @sys/cli/shell. */
  export type AliasEntry = ReturnType<ShellLib['Alias']['list']>[number];
  export type PathEntry = ReturnType<ShellLib['Path']['list']>[number];
  /** Existing managed block state from @sys/cli/shell. */
  export type BlockState = ReturnType<ShellLib['Block']['detect']>;

  /** Read-only shell doctor report. */
  export namespace Doctor {
    export type ShellInfo = {
      readonly path?: string;
      readonly dialect?: PosixDialect;
      readonly support: Support;
    };

    export type EnvInfo = {
      readonly home?: t.StringDir;
      readonly denoInstall?: t.StringDir;
      readonly denoBin?: t.StringDir;
      readonly pathContainsDenoBin: boolean;
    };

    export type Profile = {
      readonly path: t.StringPath;
      readonly role: string;
      readonly exists: boolean;
      readonly block: BlockState;
    };

    export type Catalog = {
      readonly aliases: readonly AliasEntry[];
      readonly paths: readonly PathEntry[];
    };

    export type Report = {
      readonly owner: Owner;
      readonly shell: ShellInfo;
      readonly env: EnvInfo;
      readonly profiles: readonly Profile[];
      readonly catalog: Catalog;
      readonly warnings: readonly string[];
    };
  }
}
