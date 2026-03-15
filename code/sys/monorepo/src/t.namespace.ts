import type { t } from './common.ts';

/**
 * Workspace facts, selection, and task-planning primitives for @sys monorepos.
 */
export namespace Monorepo {
  /** Root monorepo helper surface. */
  export type Lib = {
    /** Continuous-integration helpers. */
    readonly Ci: t.MonorepoCi.Lib;
    /** Package metadata sync helpers. */
    readonly Pkg: t.MonorepoPkg.Lib;
    /** Source statistics helpers. */
    readonly Info: t.MonorepoInfo.Lib;
  };
}
