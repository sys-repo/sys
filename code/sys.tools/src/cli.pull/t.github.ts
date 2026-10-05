import type { t } from './common.ts';

/**
 * Bounded, confined GitHub download authority.
 *
 * Results describe generic mutable files only. They carry no Dist manifest, integrity,
 * verification evidence, or HTTP transport record.
 */
export declare namespace GithubPull {
  /** Public GitHub Pull operations. */
  export type Lib = {
    /** Download selected release assets into one explicit target directory. */
    readonly release: (args: ReleaseArgs) => Promise<Outcome>;
    /** Download a repository tree or subtree into one explicit target directory. */
    readonly repo: (args: RepoArgs) => Promise<Outcome>;
  };

  /** Explicit target mutation authority. */
  export type Mode = 'create' | 'replace';

  /** Required finite limits for one complete operation. */
  export type Limits = {
    /** Maximum aggregate bytes retained across source metadata responses. */
    readonly metadataBytes: t.NumberBytes;
    /** Maximum source entries admitted before download. */
    readonly entries: t.NumberTotal;
    /** Maximum bytes accepted for any one downloaded file. */
    readonly fileBytes: t.NumberBytes;
    /** Maximum aggregate downloaded file bytes. */
    readonly totalBytes: t.NumberBytes;
    /** Maximum milliseconds for the complete operation. */
    readonly totalTime: t.Msecs;
  };

  /** Inputs shared by release and repository operations. */
  export type Args = {
    /** GitHub repository in exact `owner/repo` form. */
    readonly repo: string;
    /** Exact output directory selected by the caller. */
    readonly into: t.StringDir;
    /** Whether the output must be absent or may be explicitly replaced. */
    readonly mode: Mode;
    /** Required finite operation limits. */
    readonly limits: Limits;
    /** Optional GitHub token sent only to the admitted GitHub API origin. */
    readonly token?: string;
    /** Cancel when this lifecycle ends. */
    readonly until?: t.UntilInput;
  };

  /** Release download inputs. */
  export type ReleaseArgs = Args & {
    /** Exact release tag; omission resolves GitHub's latest stable release. */
    readonly tag?: string;
    /** Exact release asset names; omission selects every asset in the resolved release. */
    readonly assets?: readonly string[];
  };

  /** Repository download inputs. */
  export type RepoArgs = Args & {
    /** Branch, tag, or commit; omission resolves the repository default branch. */
    readonly ref?: string;
    /** Optional repository-relative directory subtree. */
    readonly path?: string;
  };

  /** One successfully published generic file. */
  export type DownloadedFile = {
    /** Owner-constructed GitHub source URL requested for this file. */
    readonly source: t.StringUrl;
    /** Root-relative target beneath `into`. */
    readonly target: t.StringRelativePath;
    /** Exact bytes published. */
    readonly bytes: t.NumberBytes;
  };

  /** Resolved source evidence. */
  export type Resolved = ReleaseResolved | RepoResolved;

  /** Resolved release evidence. */
  export type ReleaseResolved = {
    readonly kind: 'github:release';
    readonly repo: string;
    readonly tag: string;
    readonly assets: readonly string[];
  };

  /** Resolved repository evidence. */
  export type RepoResolved = {
    readonly kind: 'github:repo';
    readonly repo: string;
    readonly ref: string;
    readonly commit: string;
    readonly tree: string;
    readonly path?: string;
  };

  /** Complete public operation result. */
  export type Outcome = Success | Failure;

  /** Successful generic download. */
  export type Success = {
    readonly ok: true;
    readonly into: t.StringAbsoluteDir;
    readonly resolved: Resolved;
    readonly files: readonly DownloadedFile[];
  };

  /** Stable public failure classification. */
  export type FailureKind =
    | 'invalid-input'
    | 'source-failure'
    | 'limit-exceeded'
    | 'target-occupied'
    | 'unsafe-target'
    | 'publication-failure'
    | 'cancelled';

  /** Failed operation with truthful partial-publication records. */
  export type Failure = {
    readonly ok: false;
    readonly kind: FailureKind;
    readonly error: string;
    readonly into?: t.StringAbsoluteDir;
    readonly resolved?: Resolved;
    readonly files: readonly DownloadedFile[];
  };
}
