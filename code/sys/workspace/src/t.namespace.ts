import type { t } from './common.ts';

/**
 * Workspace facts, selection, and task-planning primitives.
 */
export namespace Workspace {
  /** Root workspace helper surface. */
  export type Lib = {
    /** Continuous-integration helpers. */
    readonly Ci: t.WorkspaceCi.Lib;
    /** Package metadata sync helpers. */
    readonly Pkg: t.WorkspacePkg.Lib;
    /** Source statistics helpers. */
    readonly Info: t.WorkspaceInfo.Lib;
  };
}
