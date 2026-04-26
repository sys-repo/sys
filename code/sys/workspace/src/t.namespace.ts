import type { t } from './common.ts';

/**
 * Workspace facts, selection, and task-planning primitives.
 */
export namespace Workspace {
  /** Root workspace helper surface. */
  export type Lib = {
    /** Workspace package version bump orchestration helpers. */
    readonly Bump: t.WorkspaceBump.Lib;

    /** Continuous-integration helpers. */
    readonly Ci: t.WorkspaceCi.Lib;

    /** CLI entrypoints for workspace tooling. */
    readonly Cli: t.WorkspaceCli.Lib;

    /** Local workspace graph and package-order helpers. */
    readonly Graph: t.WorkspaceGraph.Lib;

    /** Package metadata sync helpers. */
    readonly Pkg: t.WorkspacePkg.Lib;

    /** Source statistics helpers. */
    readonly Info: t.WorkspaceInfo.Lib;

    /** Dependency upgrade orchestration helpers. */
    readonly Upgrade: t.WorkspaceUpgrade.Lib;

    /** Workspace preparation helpers. */
    readonly Prep: t.WorkspacePrep.Lib;

    /** Canonical workspace task runners. */
    readonly Run: t.WorkspaceRun.Lib;
  };
}
