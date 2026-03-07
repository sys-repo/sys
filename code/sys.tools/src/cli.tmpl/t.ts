import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.namespace.ts';

/**
 * CLI helpers for the thin `@sys/tools/tmpl` wrapper.
 */
export type TmplToolsLib = {
  /** Delegate to `@sys/tmpl` with passthrough argv/cwd semantics. */
  cli(cwd?: t.StringDir, argv?: string[]): Promise<void>;
};
