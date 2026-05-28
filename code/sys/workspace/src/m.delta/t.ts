import type { t } from './common.ts';

/**
 * Workspace package-level change delta helpers.
 */
export declare namespace WorkspaceDelta {
  /** Deterministic workspace delta helper surface. */
  export type Lib = {
    /** Derive package bump roots and closure from changed workspace-relative files. */
    fromChangedFiles(args: FromChangedFilesArgs): Result;
    /** Git-backed workspace delta adapters. */
    readonly Git: Git.Lib;
  };

  /** Inputs for deriving one workspace delta from a changed-file list. */
  export type FromChangedFilesArgs = {
    /** Collected workspace bump inputs. */
    readonly collect: t.WorkspaceBump.CollectResult;
    /** Workspace-root-relative changed files. */
    readonly changedFiles: readonly t.StringPath[];
  };

  /** Result of mapping changed files to bump roots and dependent closure. */
  export type Result = {
    /** Input changed files, normalized and deduplicated in first-seen order. */
    readonly changedFiles: readonly t.StringPath[];
    /** Changed bump-candidate package paths in stable workspace order. */
    readonly changedPkgPaths: readonly t.StringPath[];
    /** Package paths that should be passed as bump roots. */
    readonly bumpRootPkgPaths: readonly t.StringPath[];
    /** Full dependent bump closure in stable workspace order. */
    readonly bumpClosurePkgPaths: readonly t.StringPath[];
    /** Changed files that did not map to a bumpable package. */
    readonly skipped: readonly Skip[];
  };

  /** One changed file skipped by delta derivation. */
  export type Skip = {
    /** Workspace-root-relative file path. */
    readonly file: t.StringPath;
    /** Stable reason the file did not map to a bump root. */
    readonly reason: SkipReason;
  };

  /** Stable skip reasons emitted by delta derivation. */
  export type SkipReason = 'outside-workspace-package' | 'outside-bump-candidates';

  /**
   * Git-backed workspace delta adapters.
   */
  export namespace Git {
    /** Git delta adapter helper surface. */
    export type Lib = {
      /** Derive package bump roots and closure from git name-status records. */
      fromNameStatus(args: FromNameStatusArgs): WorkspaceDelta.Result;
      /** Derive package delta facts from one git baseline ref. */
      fromRef(args: FromRefArgs): Promise<FromRefResult>;
    };

    /** Inputs for deriving one workspace delta from git name-status records. */
    export type FromNameStatusArgs = {
      /** Collected workspace bump inputs. */
      readonly collect: t.WorkspaceBump.CollectResult;
      /** Git name-status records or raw tab-delimited name-status lines. */
      readonly nameStatus: readonly NameStatusInput[];
    };

    /** Inputs for deriving one workspace delta from a git baseline ref. */
    export type FromRefArgs = {
      /** Working directory used for git and graph snapshot reads. */
      readonly cwd?: t.StringDir;
      /** Git baseline ref. The bump CLI maps `--since=<ref>` to this field. */
      readonly ref: string;
      /** Git head ref to compare against. Defaults to `HEAD`. */
      readonly head?: string;
      /** Persisted graph snapshot path. Defaults to `<cwd>/deno.graph.json`. */
      readonly graphPath?: t.StringPath;
      /** Release type used when collecting current bump candidates. Defaults to `patch`. */
      readonly release?: t.SemverReleaseType;
      /** Repo-specific bump policy. */
      readonly policy?: t.WorkspaceBump.Policy;
    };

    /** Result of deriving one workspace delta from a git baseline ref. */
    export type FromRefResult = WorkspaceDelta.Result & {
      /** Collected current workspace bump inputs used by downstream bump planning. */
      readonly collect: t.WorkspaceBump.CollectResult;
      /** Git baseline ref used for the comparison. */
      readonly ref: string;
      /** Git head ref used for the comparison. */
      readonly head: string;
      /** Persisted graph snapshot path read for the comparison. */
      readonly graphPath: t.StringPath;
      /** Changed packages whose current version already differs from the baseline ref. */
      readonly alreadyBumpedPkgPaths: readonly t.StringPath[];
      /** Changed packages whose current version still matches the baseline ref. */
      readonly needsBumpPkgPaths: readonly t.StringPath[];
      /** Changed packages that had no bumpable manifest version at the baseline ref. */
      readonly newPkgPaths: readonly t.StringPath[];
    };

    /** One supported git name-status input item. */
    export type NameStatusInput = NameStatusRecord | NameStatusLine;

    /** Raw tab-delimited line from `git diff --name-status`. */
    export type NameStatusLine = string;

    /** Structured git name-status record. */
    export type NameStatusRecord = {
      /** Git status token, such as `M`, `A`, `D`, `R100`, or `C75`. */
      readonly status: string;
      /** Current path, or the deleted path for deletion records. */
      readonly path: t.StringPath;
      /** Previous path for rename and copy records when present. */
      readonly previousPath?: t.StringPath;
    };
  }
}
