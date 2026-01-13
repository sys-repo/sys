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
    | t.CrdtTool.Id
    | t.DeployTool.Id
    | t.FsTool.Id
    | t.UpdateTool.Id
    | t.VideoTool.Id;

  /** Command line arguments (argv). */
  /** Common flags. */
  export type CliArgs = { help: boolean };
  /** Root-entry-only flags */
  export type CliRootArgs = CliArgs & {};
  /** Root parse result (adds typed command from first positional). */
  export type CliRootParsedArgs = t.ParsedArgs<CliRootArgs> & { readonly command?: Command };

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
