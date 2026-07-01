import type { StringDir } from '@sys/types';
import type { UpgradeTool } from './t.namespace.ts';

/** @system: common upgrade-visible types */
export type * from '@sys/types';
export type { Registry } from '@sys/registry/t';
export type { WorkspaceResolve } from '@sys/workspace/t';
export type { ParsedArgs } from '@sys/std/t';
export type {
  CliFormatHelpInput,
  CliFormatHelpInputSections,
  CliFormatHelpInputShorthand,
  CliSpinner,
} from '@sys/cli/t';

/** Minimal root-tool vocabulary used by upgrade. */
export namespace Tools {
  export type CliArgs = { help: boolean; debug?: boolean };
}

/** Common result response from tool runs. */
export type RunReturn = {
  /** Process exit code to invoke. True = exit(0). */
  exit: number | boolean;
};

/** Local upgrade types. */
export type * from './t.namespace.ts';

/** CLI helpers for upgrading the locally installed `@sys/tools` module. */
export type UpgradeToolsLib = {
  /** Run the interactive CLI flow (prompts + spinner). */
  cli(
    cwd?: StringDir,
    argv?: string[],
    context?: UpgradeTool.CliContext,
  ): Promise<UpgradeTool.CliResult>;
};
