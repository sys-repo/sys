import type { StringDir } from '@sys/types';
import type { UpdateTool } from './t.namespace.ts';

/** @system: common update-visible types */
export type * from '@sys/types';
export type { ParsedArgs } from '@sys/std/t';
export type {
  CliFormatHelpInput,
  CliFormatHelpInputSections,
  CliFormatHelpInputShorthand,
} from '@sys/cli/t';

/** Minimal root-tool vocabulary used by update. */
export namespace Tools {
  export type CliArgs = { help: boolean; debug?: boolean };
}

/** Common result response from tool runs. */
export type RunReturn = {
  /** Process exit code to invoke. True = exit(0). */
  exit: number | boolean;
};

/** Local update types. */
export type * from './t.namespace.ts';

/** CLI helpers for updating the locally installed `@sys/tools` module. */
export type UpdateToolsLib = {
  /** Run the interactive CLI flow (prompts + spinner). */
  cli(
    cwd?: StringDir,
    argv?: string[],
    context?: UpdateTool.CliContext,
  ): Promise<UpdateTool.CliResult>;
};
