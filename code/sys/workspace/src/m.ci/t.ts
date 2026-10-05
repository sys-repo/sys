import type { t } from './common.ts';

/**
 * Continuous-integration helpers for multi-package repositories.
 */
export namespace WorkspaceCi {
  /** Continuous-integration helper surface. */
  export type Lib = {
    /** JSR publish workflow helpers. */
    readonly Jsr: Jsr.Lib;
    /** Build workflow helpers. */
    readonly Build: Build.Lib;
    /** Test workflow helpers. */
    readonly Test: Test.Lib;
    /** Commit-summary formatters for workspace CI close-out output. */
    readonly Fmt: Fmt.Lib;
    /** Sync workspace CI workflows and emit prep summaries. */
    sync(args: SyncArgs): Promise<SyncSummary>;
  };

  /** Arguments for syncing workspace CI workflows. */
  export type SyncArgs = {
    /** Working directory used to resolve modules and write workflows. */
    readonly cwd?: t.StringDir;
    /** Ordered source module paths used for workflow generation. */
    readonly sourcePaths: readonly t.StringPath[];
    /** Optional version-based JSR module filter. */
    readonly versionFilter?: Jsr.VersionFilter;
    /** Optional package scopes allowed in the generated JSR publish workflow. */
    readonly jsrScopes?: readonly string[];
    /** Optional prep count rendered as refreshed workspace packages in the final commit summary. */
    readonly prepared?: number;
    /** Emit the final aggregate commit-summary block. */
    readonly final?: boolean;
    /** Suppress phase and summary output. */
    readonly silent?: boolean;
    /**
     * Ensure the workspace graph snapshot before syncing workflows.
     * Disable this only when the caller has already run `Workspace.Prep.run()` in the same flow.
     */
    readonly ensureGraph?: boolean;
    /** Workflow file targets. */
    readonly targets?: {
      readonly jsr?: t.StringPath;
      readonly build?: t.StringPath;
      readonly test?: {
        readonly linux?: t.StringPath;
        readonly windows?: t.StringPath;
      };
    };
    /** Build/test workflow trigger configuration. */
    readonly on?: WorkflowOn;
    /** JSR publish workflow trigger configuration. */
    readonly jsrOn?: WorkflowOn;
    /** Workflow environment variables for JSR, build, and Linux test workflows. */
    readonly env?: WorkflowEntries;
  };

  /** Result from syncing workspace CI workflows. */
  export type SyncSummary = {
    readonly jsr: SyncResult;
    readonly build: SyncResult;
    readonly test: {
      readonly linux: SyncResult;
      readonly windows: SyncResult;
    };
  };

  /** Commit-summary formatters for workspace CI close-out output. */
  export namespace Fmt {
    /** Workspace CI formatter helper surface. */
    export type Lib = {
      /** Format the final aggregate workspace refresh commit message. */
      finalCommitMessage(args: FinalCommitMessageArgs): string;
      /** Format the final aggregate workspace refresh commit-message suggestion block. */
      finalCommitSuggestion(args: FinalCommitMessageArgs): string;
    };

    /** Counts used to format the final aggregate workspace refresh commit message. */
    export type FinalCommitMessageArgs = {
      /** Count rendered as refreshed workspace packages. */
      readonly refreshedWorkspacePackageCount: number;
      /** Count rendered as JSR publish modules. */
      readonly jsrPublishModuleCount: number;
    };
  }

  /**
   * JSR publish workflow generation.
   */
  export namespace Jsr {
    /** Module selection strategy for JSR publish workflows. */
    export type VersionFilter = 'all' | 'ahead';

    /** JSR workflow helper surface. */
    export type Lib = {
      /** JSR publishability predicates. */
      readonly Is: Is.Lib;
      /** Render workflow YAML without writing files. */
      text(args: TextArgs): Promise<string>;
      /** Write a JSR workflow file to disk. */
      write(args: WriteArgs): Promise<WriteResult>;
      /** Sync a JSR workflow file from discovered source modules. */
      sync(args: SyncArgs): Promise<SyncResult>;
    };
    /** Arguments for rendering a JSR publish workflow. */
    export type TextArgs = {
      /** Working directory used to resolve module paths. */
      readonly cwd?: t.StringDir;
      /** Candidate module paths to consider for publishing. */
      readonly paths: readonly t.StringPath[];
      /** Optional version-based module filter. */
      readonly versionFilter?: VersionFilter;
      /** Optional workflow trigger configuration. */
      readonly on?: WorkflowOn;
      /** Optional workflow environment variables. */
      readonly env?: WorkflowEntries;
    };
    /** Arguments for writing a rendered JSR workflow file. */
    export type WriteArgs = TextArgs & { readonly target: t.StringPath };
    /** Arguments for syncing a JSR workflow from discovered modules. */
    export type SyncArgs = {
      /** Working directory used to resolve source paths. */
      readonly cwd?: t.StringDir;
      /** Source selection for workflow module discovery. */
      readonly source: Source;
      /** Output workflow file path. */
      readonly target: t.StringPath;
      /** Optional version-based module filter. */
      readonly versionFilter?: VersionFilter;
      /** Optional workflow trigger configuration. */
      readonly on?: WorkflowOn;
      /** Optional workflow environment variables. */
      readonly env?: WorkflowEntries;
      /** Emit sync logging to the console. */
      readonly log?: boolean;
    };
    /** Result from writing a JSR workflow file. */
    export type WriteResult = {
      /** Written workflow file path. */
      readonly target: t.StringPath;
      /** Rendered workflow YAML. */
      readonly yaml: string;
      /** Number of workflow matrix items rendered. */
      readonly count: number;
      /** Whether the written file changed. */
      readonly changed: boolean;
    };

    /** JSR publishability predicates. */
    export namespace Is {
      export type Lib = {
        /** Determine whether a package name has valid JSR package-name syntax. */
        pkgName(name: string): boolean;
        /** Determine whether a local package should be included in JSR workflow generation. */
        publishable(
          path: t.StringPath,
          cwd?: t.StringDir,
          options?: PublishableOptions,
        ): Promise<boolean>;
      };

      export type PublishableOptions = {
        /** Optional package scopes allowed in the generated JSR publish workflow. */
        readonly scopes?: readonly string[];
      };
    }
  }

  /**
   * Build workflow generation for modules with a `deno task build` surface.
   */
  export namespace Build {
    /** Build workflow helper surface. */
    export type Lib = {
      /** Render workflow YAML without writing files. */
      text(args: Args): Promise<string>;
      /** Write a build workflow file to disk. */
      write(args: WriteArgs): Promise<WriteResult>;
      /** Sync a build workflow file from discovered source modules. */
      sync(args: SyncArgs): Promise<SyncResult>;
    };
    /** Arguments for rendering a build workflow. */
    export type Args = {
      /** Working directory used to resolve module paths. */
      readonly cwd?: t.StringDir;
      /** Module paths to include in the build matrix. */
      readonly paths: readonly t.StringPath[];
      /** Optional workflow trigger configuration. */
      readonly on?: WorkflowOn;
      /** Optional workflow environment variables. */
      readonly env?: WorkflowEntries;
    };
    /** Arguments for writing a rendered build workflow file. */
    export type WriteArgs = Args & { readonly target: t.StringPath };
    /** Arguments for syncing a build workflow from discovered modules. */
    export type SyncArgs = {
      /** Working directory used to resolve source paths. */
      readonly cwd?: t.StringDir;
      /** Source selection for workflow module discovery. */
      readonly source: Source;
      /** Output workflow file path. */
      readonly target: t.StringPath;
      /** Optional workflow trigger configuration. */
      readonly on?: WorkflowOn;
      /** Optional workflow environment variables. */
      readonly env?: WorkflowEntries;
      /** Emit sync logging to the console. */
      readonly log?: boolean;
    };
    /** Result from writing a build workflow file. */
    export type WriteResult = {
      /** Written workflow file path. */
      readonly target: t.StringPath;
      /** Rendered workflow YAML. */
      readonly yaml: string;
      /** Number of workflow matrix items rendered. */
      readonly count: number;
      /** Whether the written file changed. */
      readonly changed: boolean;
    };
  }

  /**
   * Host-specific test workflow generation.
   */
  export namespace Test {
    /** Root test workflow helper surface. */
    export type Lib = {
      /** Linux test workflow helpers. */
      readonly Linux: Linux.Lib;
      /** Windows test workflow helpers. */
      readonly Windows: Windows.Lib;
    };

    /** Linux workflow generation for modules with a `deno task test` surface. */
    export namespace Linux {
      /** Linux test workflow helper surface. */
      export type Lib = {
        /** Render workflow YAML without writing files. */
        text(args: Args): Promise<string>;
        /** Write a Linux test workflow file to disk. */
        write(args: WriteArgs): Promise<WriteResult>;
        /** Sync a Linux test workflow file from discovered source modules. */
        sync(args: SyncArgs): Promise<SyncResult>;
      };
      /** Arguments for rendering a Linux test workflow. */
      export type Args = {
        /** Working directory used to resolve module paths. */
        readonly cwd?: t.StringDir;
        /** Module paths to include in the test matrix. */
        readonly paths: readonly t.StringPath[];
        /** Optional workflow trigger configuration. */
        readonly on?: WorkflowOn;
        /** Optional workflow environment variables. */
        readonly env?: WorkflowEntries;
      };
      /** Arguments for writing a rendered Linux test workflow file. */
      export type WriteArgs = Args & { readonly target: t.StringPath };
      /** Arguments for syncing a Linux test workflow from discovered modules. */
      export type SyncArgs = {
        /** Working directory used to resolve source paths. */
        readonly cwd?: t.StringDir;
        /** Source selection for workflow module discovery. */
        readonly source: Source;
        /** Output workflow file path. */
        readonly target: t.StringPath;
        /** Optional workflow trigger configuration. */
        readonly on?: WorkflowOn;
        /** Optional workflow environment variables. */
        readonly env?: WorkflowEntries;
        /** Emit sync logging to the console. */
        readonly log?: boolean;
      };
      /** Result from writing a Linux test workflow file. */
      export type WriteResult = TestWriteResult;
    }

    /** Windows workflow generation for modules with a `deno task test:windows` surface. */
    export namespace Windows {
      /** Windows test workflow helper surface. */
      export type Lib = {
        /** Render workflow YAML without writing files. */
        text(args: Args): Promise<string>;
        /** Write a Windows test workflow file to disk. */
        write(args: WriteArgs): Promise<WriteResult>;
        /** Sync a Windows test workflow file from discovered source modules. */
        sync(args: SyncArgs): Promise<SyncResult>;
      };
      /** Arguments for rendering a Windows test workflow. */
      export type Args = {
        /** Working directory used to resolve module paths. */
        readonly cwd?: t.StringDir;
        /** Module paths to include in the test matrix. */
        readonly paths: readonly t.StringPath[];
        /** Optional workflow trigger configuration. */
        readonly on?: WorkflowOn;
      };
      /** Arguments for writing a rendered Windows test workflow file. */
      export type WriteArgs = Args & { readonly target: t.StringPath };
      /** Arguments for syncing a Windows test workflow from discovered modules. */
      export type SyncArgs = {
        /** Working directory used to resolve source paths. */
        readonly cwd?: t.StringDir;
        /** Source selection for workflow module discovery. */
        readonly source: Source;
        /** Output workflow file path. */
        readonly target: t.StringPath;
        /** Optional workflow trigger configuration. */
        readonly on?: WorkflowOn;
        /** Emit sync logging to the console. */
        readonly log?: boolean;
      };
      /** Result from writing a Windows test workflow file. */
      export type WriteResult = TestWriteResult;
    }

    /** Result from writing a host-specific test workflow file. */
    export type TestWriteResult = {
      /** Written workflow file path. */
      readonly target: t.StringPath;
      /** Rendered workflow YAML. */
      readonly yaml: string;
      /** Number of workflow matrix items rendered. */
      readonly count: number;
      /** Whether the written file changed. */
      readonly changed: boolean;
    };
  }

  /** Environment variable entries injected into workflow files. */
  export type WorkflowEntries = Readonly<Record<string, string>>;
  /** Pull-request style workflow branch filters. */
  export type WorkflowBranches = Readonly<{
    /** Branch names that trigger the workflow. */
    branches?: readonly string[];
    /** Paths ignored when deciding whether to trigger. */
    paths_ignore?: readonly string[];
  }>;
  /** Push workflow trigger filters. */
  export type WorkflowPush = Readonly<{
    /** Branch names that trigger the workflow. */
    branches?: readonly string[];
    /** Tag names that trigger the workflow. */
    tags?: readonly string[];
    /** Paths ignored when deciding whether to trigger. */
    paths_ignore?: readonly string[];
  }>;
  /** GitHub Actions trigger configuration. */
  export type WorkflowOn = Readonly<{
    /** Push trigger configuration. */
    push?: WorkflowPush;
    /** Pull request trigger configuration. */
    pull_request?: WorkflowBranches;
    /** Enable manual workflow dispatch. */
    workflow_dispatch?: boolean;
  }>;
  /** Source selection rooted at a directory. */
  export type SourceRoot = {
    /** Root directory used for workflow module discovery. */
    readonly root: t.StringPath;
  };
  /** Source selection from explicit paths. */
  export type SourcePaths = {
    /** Explicit source paths used for workflow module discovery. */
    readonly paths: readonly t.StringPath[];
  };
  /** Source selection for workflow module discovery. */
  export type Source = SourceRoot | SourcePaths;
  /** Result from syncing a generated workflow file. */
  export type SyncResult =
    | {
      /** Sync wrote a new workflow file. */
      readonly kind: 'written';
      /** Workflow file path. */
      readonly target: t.StringPath;
      /** Rendered workflow YAML. */
      readonly yaml: string;
      /** Number of workflow matrix items rendered. */
      readonly count: number;
    }
    | {
      /** Sync removed a stale workflow file. */
      readonly kind: 'removed';
      /** Workflow file path. */
      readonly target: t.StringPath;
      /** Number of workflow matrix items rendered. */
      readonly count: 0;
    }
    | {
      /** Sync found the workflow file already up to date. */
      readonly kind: 'unchanged';
      /** Workflow file path. */
      readonly target: t.StringPath;
      /** Number of workflow matrix items rendered. */
      readonly count: number;
    }
    | {
      /** Sync skipped because no workflow file should exist. */
      readonly kind: 'skipped';
      /** Workflow file path. */
      readonly target: t.StringPath;
      /** Number of workflow matrix items rendered. */
      readonly count: 0;
    };
}
