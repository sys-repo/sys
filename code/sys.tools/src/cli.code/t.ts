import type { t } from './common.ts';
import type { PiCli as DriverAgentPiCli } from '@sys/driver-agent/types';

/** Type re-exports. */
export type * from './t.namespace.ts';

/**
 * CLI helpers for the thin `@sys/tools/code` wrapper.
 */
export type CodeToolsLib = {
  /** Delegate to `@sys/driver-agent/pi/cli` with passthrough argv/cwd semantics. */
  cli(cwd?: t.StringDir, argv?: string[]): Promise<void>;
};

/** Canonical delegated CLI contract. */
export type DriverAgentPiCliLib = DriverAgentPiCli.Lib;
