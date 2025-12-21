import type { t } from './common.ts';

/**
 * Common result response from tool runs.
 */
export type RunReturn = {
  /** Process exit code to invoke. True = exit(0); */
  exit: number | boolean;
};

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
  export type CliArgs = { help: boolean };
  export type CliParsedArgs = t.ParsedArgs<CliArgs>;

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
