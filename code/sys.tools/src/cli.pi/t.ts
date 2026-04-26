import type { t } from '../common.ts';

/**
 * The `@sys/tools/code` namespace.
 *
 * Internal folder note:
 * - implementation now lives under `cli.pi/`
 * - public command/export surface remains `@sys/tools/code`
 */
export namespace CodeTool {
  export const ID = 'code' as const;
  export const NAME = 'system/code:tools' as const;
  export type Id = typeof ID;
  export type Name = typeof NAME;

  /** Command line arguments (argv). */
  export type CliArgs = t.Tools.CliArgs;
  export type CliParsedArgs = t.ParsedArgs<CliArgs>;
}

/**
 * Code agent profile launcher.
 */
export type CodeToolsLib = {
  /** Delegate to `@sys/driver-agent/pi/cli Profiles` with passthrough argv/cwd semantics. */
  cli(cwd?: t.StringDir, argv?: string[]): Promise<void>;
};
