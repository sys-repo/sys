import type { t } from './common.ts';

/**
 * Root `@sys/tools` type namespace.
 */
export namespace Tools {
  export type Id = 'tools';
  export type Name = 'system/tools';

  /** Command names. */
  export type Command =
    | t.ServeTool.Id
    | t.ClipboardTool.Id
    | t.PiTool.Id
    | t.CryptoTool.Id
    | t.CrdtTool.Id
    | t.DeployTool.Id
    | t.UpgradeTool.Id
    | t.VideoTool.Id
    | t.PullTool.Id
    | t.ShellTool.Id
    | t.TmplTool.Id
    | 'dsl';

  /** Command line arguments (argv). */
  /** Common flags. */
  export type CliArgs = { help: boolean; debug?: boolean };
  /** Root-entry-only flags. */
  export type CliRootArgs = CliArgs & {
    readonly noUpgradeCheck?: boolean;
    readonly 'no-upgrade-check'?: boolean;
  };
  /** Root parse result (adds typed command from first positional). */
  export type CliRootParsedArgs = t.ParsedArgs<CliRootArgs> & { readonly command?: Command };

  /** Owner config refs supplied by programmatic Cell/task callers. */
  export type ConfigRefPaths = { readonly config: t.StringPath };
  /** Optional owner config refs for config alias compatibility. */
  export type ConfigRefPathsInput = { readonly config?: t.StringPath };
  /** Programmatic config-ref selector accepted by finite tool endpoints. */
  export type ConfigRefArgs =
    | { readonly config: t.StringPath; readonly paths?: ConfigRefPathsInput }
    | { readonly config?: never; readonly paths: ConfigRefPaths };

  /**
   * Usage timestamps for recency-aware behavior.
   * Example: used by the core `Config.orderByRecency` helper.
   */
  export type Recency = {
    /** Creation time. */
    createdAt?: t.UnixTimestamp;
    /** Most recent usage time. */
    lastUsedAt?: t.UnixTimestamp;
  };

  /**
   * Common UI prompts:
   */
  export namespace Prompt {
    export namespace Dirs {
      export type MenuLabel = readonly [key: string, path?: string];
      export type MenuEntry = { readonly name: MenuLabel; readonly dir: t.StringDir };
      export type RenderResult = { readonly label: string; readonly sortKey?: string };
      export type RenderRow = (e: MenuEntry) => RenderResult;
    }
  }
}
