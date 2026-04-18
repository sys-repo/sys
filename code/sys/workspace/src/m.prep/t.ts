import type { t } from './common.ts';

/**
 * Workspace preparation helpers.
 */
export declare namespace WorkspacePrep {
  export type Lib = {
    readonly State: State.Lib;
    readonly Deps: Deps.Lib;
    readonly Fmt: Fmt.Lib;
    readonly Graph: Graph.Lib;
    readonly Workspace: Workspace.Lib;
    run(args?: RunArgs): Promise<RunResult>;
  };

  /** Arguments for a canonical workspace prep run. */
  export type RunArgs = {
    /** Working directory for prep operations. Defaults to `Fs.cwd()`. */
    readonly cwd?: t.StringDir;
    /** Optional precomputed graph payload used to avoid recollection. */
    readonly graph?: t.WorkspaceGraph.PersistedGraph;
    /** Suppress prep phase output. */
    readonly silent?: boolean;
  };

  /** Result summary from a canonical workspace prep run. */
  export type RunResult = {
    readonly workspace: { readonly changed: boolean; readonly path: t.StringPath };
    readonly graph: {
      readonly changed: boolean;
      readonly path: t.StringPath;
      readonly snapshot: t.WorkspaceGraph.Snapshot.Doc;
    };
  };

  /** Prep-time sync of canonical deps.yaml into root dependency files. */
  export namespace Deps {
    /** Runtime surface for prep-time dependency projection. */
    export type Lib = {
      /** Sync `deps.yaml` projections into root Deno and package authorities. */
      sync(args?: SyncArgs): Promise<SyncResult>;
    };

    /** Arguments for syncing canonical deps.yaml projections into workspace files. */
    export type SyncArgs = {
      /** Working directory used to resolve default dependency targets. */
      readonly cwd?: t.StringDir;
      /** Optional explicit `deps.yaml` manifest path. */
      readonly depsPath?: t.StringPath;
      /** Optional explicit root `deno.json` path. */
      readonly denoFilePath?: t.StringPath;
      /** Optional explicit `package.json` path. */
      readonly packageFilePath?: t.StringPath;
      /** Emit the canonical import-map summary after syncing. */
      readonly log?: boolean;
    };

    /** Result from projecting canonical dependency state into workspace files. */
    export type SyncResult = {
      /** Number of canonical manifest entries applied. */
      readonly total: number;
      /** Resolved `deps.yaml` source path. */
      readonly depsPath: t.StringPath;
      /** Result from applying the Deno dependency projection. */
      readonly deno: t.EsmDeps.ApplyResult;
      /** Result from applying the package dependency projection, when present. */
      readonly package?: t.EsmDeps.ApplyPackageResult;
    };
  }

  /** Canonical prep-state paths and derived artifact locations. */
  export namespace State {
    export type Lib = {
      workspaceFile(cwd?: t.StringDir): t.StringPath;
      graphFile(cwd?: t.StringDir): t.StringPath;
    };
  }

  /** Prep-time graph snapshot lifecycle helpers. */
  export namespace Graph {
    export type VerifyArgs = {
      readonly cwd?: t.StringDir;
      readonly silent?: boolean;
    };

    export type WriteArgs = {
      readonly cwd?: t.StringDir;
      readonly snapshot: t.WorkspaceGraph.Snapshot.Doc;
    };

    export type EnsureArgs = {
      readonly cwd?: t.StringDir;
      readonly graph?: t.WorkspaceGraph.PersistedGraph;
      /** Suppress graph prep phase output. */
      readonly silent?: boolean;
    };

    export type CheckResult = {
      readonly path: t.StringPath;
      readonly current: boolean;
      readonly existing?: t.WorkspaceGraph.Snapshot.Doc;
      readonly expected: t.WorkspaceGraph.Snapshot.Doc;
    };

    export type Lib = {
      build(cwd?: t.StringDir): Promise<t.WorkspaceGraph.PersistedGraph>;
      snapshot(graph: t.WorkspaceGraph.PersistedGraph): t.WorkspaceGraph.Snapshot.Doc;
      read(cwd?: t.StringDir): Promise<t.WorkspaceGraph.Snapshot.Doc | undefined>;
      check(cwd?: t.StringDir): Promise<CheckResult>;
      verify(args?: VerifyArgs): Promise<CheckResult>;
      write(args: WriteArgs): Promise<RunResult['graph']>;
      ensure(args?: EnsureArgs): Promise<RunResult['graph']>;
    };
  }

  /** Prep-time root workspace maintenance helpers. */
  export namespace Workspace {
    export type Lib = {
      normalize(cwd?: t.StringDir): Promise<RunResult['workspace']>;
    };
  }

  /** Prep-time console output formatters. */
  export namespace Fmt {
    export type ImportMapArgs = {
      readonly cwd?: t.StringDir;
      readonly total: number;
      readonly paths: readonly t.StringPath[];
    };

    export type ImportMapSyncArgs = {
      readonly cwd?: t.StringDir;
      readonly result: WorkspacePrep.Deps.SyncResult;
    };

    export type Lib = {
      importMap(args: ImportMapArgs): string;
      importMapSync(args: ImportMapSyncArgs): string;
    };
  }
}
