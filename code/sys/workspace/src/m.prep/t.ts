import type { t } from './common.ts';

/**
 * Workspace preparation helpers.
 */
export declare namespace WorkspacePrep {
  export type Lib = {
    readonly State: State.Lib;
    readonly Graph: Graph.Lib;
    readonly Workspace: Workspace.Lib;
    run(args?: RunArgs): Promise<RunResult>;
  };

  /** Arguments for a canonical workspace prep run. */
  export type RunArgs = {
    /** Working directory for prep operations. Defaults to `Deno.cwd()`. */
    readonly cwd?: t.StringDir;
  };

  /** Result summary from a canonical workspace prep run. */
  export type RunResult = {
    readonly workspace: { readonly changed: boolean };
    readonly graph: { readonly changed: boolean; readonly path: t.StringPath };
  };

  /** Canonical prep-state paths and derived artifact locations. */
  export namespace State {
    export type Lib = {};
  }

  /** Prep-time graph snapshot lifecycle helpers. */
  export namespace Graph {
    export type Lib = {};
  }

  /** Prep-time root workspace maintenance helpers. */
  export namespace Workspace {
    export type Lib = {};
  }
}
