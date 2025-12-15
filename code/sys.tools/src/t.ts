import type { t } from './common.ts';

import { ClipboardTool } from './cli.clipboard/t.ts';
import { CrdtTool } from './cli.crdt/t.ts';
import { DeployTool } from './cli.deploy/t.ts';
import { FsTool } from './cli.fs/t.ts';
import { ServeTool } from './cli.serve/t.ts';
import { UpdateTool } from './cli.update/t.ts';
import { VideoTool } from './cli.video/t.ts';

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

  /** Command names */
  export type Command =
    | ServeTool.Id
    | ClipboardTool.Id
    | CrdtTool.Id
    | DeployTool.Id
    | FsTool.Id
    | UpdateTool.Id
    | VideoTool.Id;

  /** Command line arguments (argv). */
  export type CliArgs = { help: boolean };
  export type CliParsedArgs = t.ParsedArgs<CliArgs>;
}
