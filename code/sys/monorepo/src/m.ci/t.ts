import type { t } from './common.ts';

/**
 * @module
 * Continuous-integration module surface for monorepo tooling.
 */
export namespace MonorepoCi {
  export type Lib = {
    readonly Jsr: Jsr.Lib;
    readonly Build: Build.Lib;
    readonly Test: Test.Lib;
  };

  /**
   * JSR publish workflow generation.
   */
  export namespace Jsr {
    export type VersionFilter = 'all' | 'ahead';

    export type Lib = {
      text(args: TextArgs): Promise<string>;
      write(args: WriteArgs): Promise<WriteResult>;
      sync(args: SyncArgs): Promise<SyncResult>;
    };
    export type TextArgs = {
      readonly cwd?: t.StringDir;
      readonly paths: readonly t.StringPath[];
      readonly versionFilter?: VersionFilter;
      readonly on?: WorkflowOn;
      readonly env?: WorkflowEntries;
    };
    export type WriteArgs = TextArgs & { readonly target: t.StringPath };
    export type SyncArgs = {
      readonly cwd?: t.StringDir;
      readonly source: Source;
      readonly target: t.StringPath;
      readonly versionFilter?: VersionFilter;
      readonly on?: WorkflowOn;
      readonly env?: WorkflowEntries;
      readonly log?: boolean;
    };
    export type WriteResult = {
      readonly target: t.StringPath;
      readonly yaml: string;
      readonly count: number;
      readonly changed: boolean;
    };
  }

  /**
   * Build workflow generation for modules with a `deno task build` surface.
   */
  export namespace Build {
    export type Lib = {
      text(args: Args): Promise<string>;
      write(args: WriteArgs): Promise<WriteResult>;
      sync(args: SyncArgs): Promise<SyncResult>;
    };
    export type Args = {
      readonly cwd?: t.StringDir;
      readonly paths: readonly t.StringPath[];
      readonly on?: WorkflowOn;
      readonly env?: WorkflowEntries;
    };
    export type WriteArgs = Args & { readonly target: t.StringPath };
    export type SyncArgs = {
      readonly cwd?: t.StringDir;
      readonly source: Source;
      readonly target: t.StringPath;
      readonly on?: WorkflowOn;
      readonly env?: WorkflowEntries;
      readonly log?: boolean;
    };
    export type WriteResult = {
      readonly target: t.StringPath;
      readonly yaml: string;
      readonly count: number;
      readonly changed: boolean;
    };
  }

  /**
   * Test workflow generation for modules with a `deno task test` surface.
   */
  export namespace Test {
    export type Lib = {
      text(args: Args): Promise<string>;
      write(args: WriteArgs): Promise<WriteResult>;
      sync(args: SyncArgs): Promise<SyncResult>;
    };
    export type Args = {
      readonly cwd?: t.StringDir;
      readonly paths: readonly t.StringPath[];
      readonly on?: WorkflowOn;
      readonly env?: WorkflowEntries;
    };
    export type WriteArgs = Args & { readonly target: t.StringPath };
    export type SyncArgs = {
      readonly cwd?: t.StringDir;
      readonly source: Source;
      readonly target: t.StringPath;
      readonly on?: WorkflowOn;
      readonly env?: WorkflowEntries;
      readonly log?: boolean;
    };
    export type WriteResult = {
      readonly target: t.StringPath;
      readonly yaml: string;
      readonly count: number;
      readonly changed: boolean;
    };
  }

  export type WorkflowEntries = Readonly<Record<string, string>>;
  export type WorkflowBranches = Readonly<{
    branches?: readonly string[];
    paths_ignore?: readonly string[];
  }>;
  export type WorkflowPush = Readonly<{
    branches?: readonly string[];
    tags?: readonly string[];
    paths_ignore?: readonly string[];
  }>;
  export type WorkflowOn = Readonly<{
    push?: WorkflowPush;
    pull_request?: WorkflowBranches;
    workflow_dispatch?: boolean;
  }>;
  export type SourceRoot = { readonly root: t.StringPath };
  export type SourcePaths = { readonly paths: readonly t.StringPath[] };
  export type Source = SourceRoot | SourcePaths;
  export type SyncResult =
    | {
        readonly kind: 'written';
        readonly target: t.StringPath;
        readonly yaml: string;
        readonly count: number;
      }
    | {
        readonly kind: 'removed';
        readonly target: t.StringPath;
        readonly count: 0;
      }
    | {
        readonly kind: 'unchanged';
        readonly target: t.StringPath;
        readonly count: number;
      }
    | {
        readonly kind: 'skipped';
        readonly target: t.StringPath;
        readonly count: 0;
      };
}
