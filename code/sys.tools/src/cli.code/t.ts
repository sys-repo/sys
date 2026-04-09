import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.namespace.ts';

/**
 * CLI helpers for the thin `@sys/tools/code` wrapper.
 */
export type CodeToolsLib = {
  /** Delegate to `@sys/driver-agent/pi/cli` with passthrough argv/cwd semantics. */
  cli(cwd?: t.StringDir, argv?: string[]): Promise<void>;
};
