import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.namespace.ts';

/**
 * Code agent profile launcher.
 */
export type CodeToolsLib = {
  /** Delegate to `@sys/driver-agent/pi/cli Profiles` with passthrough argv/cwd semantics. */
  cli(cwd?: t.StringDir, argv?: string[]): Promise<void>;
};
