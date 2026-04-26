import type { t } from '../common.ts';

/**
 * The `@sys/tools/pi` namespace.
 */
export namespace PiTool {
  export const ID = 'pi' as const;
  export const NAME = 'system/pi:tools' as const;
  export type Id = typeof ID;
  export type Name = typeof NAME;

  /** Command line arguments (argv). */
  export type CliArgs = t.Tools.CliArgs;
  export type CliParsedArgs = t.ParsedArgs<CliArgs>;
}

/**
 * Pi agent profile launcher.
 */
export type PiToolsLib = {
  /** Delegate to `@sys/driver-agent/pi/cli Profiles` with passthrough argv/cwd semantics. */
  cli(cwd?: t.StringDir, argv?: string[]): Promise<void>;
};
