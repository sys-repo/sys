import type { t } from './common.ts';

/**
 * Workspace facts, selection, and task-planning primitives for @sys monorepos.
 */
export namespace Monorepo {
  export type Lib = {
    readonly Ci: t.MonorepoCi.Lib;
    readonly Pkg: t.MonorepoPkg.Lib;
    readonly Info: t.MonorepoInfo.Lib;
  };
}
