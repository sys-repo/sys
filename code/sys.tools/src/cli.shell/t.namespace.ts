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

  /** Public shell tool helper surface. */
  export type Lib = {
    /** Run the shell CLI flow. */
    cli(
      cwd?: t.StringDir,
      argv?: string[],
      context?: CliContext,
    ): Promise<CliResult>;

    /** Run the read-only shell doctor. */
    doctor(): Promise<Doctor.Report>;

    /** Alias catalog and managed-block planning helpers. */
    readonly Alias: Alias.Lib;
  };

  /** CLI sub-commands (first positional token). */
  export type Command = 'doctor' | 'alias';

  /** Command line arguments (argv). */
  export type CliArgs = t.Tools.CliArgs & {
    readonly apply?: boolean;
    readonly 'dry-run'?: boolean;
    readonly 'non-interactive'?: boolean;
    readonly profile?: string;
    readonly shell?: string;
  };
  export type CliParsedArgs = t.ParsedArgs<CliArgs> & {
    readonly command?: Command;
    readonly alias?: Alias.ParsedCommand;
  };
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

  /** Alias command state and plans. */
  export namespace Alias {
    export type Command = 'list' | 'enable';
    export type Target = 'sys' | 'common';
    export type State = 'enabled' | 'missing' | 'conflict';

    export type Lib = {
      /** Inspect the managed alias catalog and profile-managed alias state. */
      list(): Promise<ListReport>;

      /** Plan an alias enable operation without writing shell profile files. */
      enable(target: Target): Promise<EnableReport>;
    };

    export type ParsedCommand =
      | { readonly command: 'list' }
      | { readonly command: 'enable'; readonly target?: Target };

    export type Item = {
      readonly entry: AliasEntry;
      readonly state: State;
      readonly profiles: readonly t.StringPath[];
      readonly conflictProfiles: readonly t.StringPath[];
      readonly stale: boolean;
    };

    export type ListReport = {
      readonly owner: Owner;
      readonly shell: Doctor.ShellInfo;
      readonly profiles: readonly Doctor.Profile[];
      readonly items: readonly Item[];
      readonly warnings: readonly string[];
    };

    export type EnablePlan = {
      readonly kind: ReturnType<ShellLib['Block']['update']>['kind'];
      readonly changed: boolean;
      readonly block: BlockState;
      readonly preview: string;
    };

    export type EnableReport = {
      readonly owner: Owner;
      readonly target: Target;
      readonly entries: readonly AliasEntry[];
      readonly profile?: Doctor.Profile;
      readonly plan?: EnablePlan;
      readonly warnings: readonly string[];
    };
  }

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
