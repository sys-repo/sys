import type { t } from './common.ts';

/**
 * Workspace source statistics helpers.
 */
export declare namespace WorkspaceInfo {
  /** Source statistics surface. */
  export type Lib = {
    /** Canonical default policy used by workspace info helpers. */
    readonly DEFAULTS: Defaults;
    /** Compute raw-glob or package-scoped source statistics. */
    stats(args: StatsArgs): Promise<StatsResult>;
    /** Format source statistics for console output. */
    fmt(stats: StatsResult, options?: FormatOptions): string;
  };

  /** Include and exclude globs for source discovery. */
  export type Source = {
    /** Include globs scanned for source files. */
    readonly include: readonly t.StringPath[];
    /** Optional exclude globs applied to each include glob. */
    readonly exclude?: readonly t.StringPath[];
  };

  /** Raw working-directory-relative source policy. */
  export type GlobSource = Source & {
    readonly kind: 'glob';
  };

  /** Package-root-relative source policy. */
  export type PackageSource = Source & {
    readonly kind: 'package';
  };

  /** Normalized source policy recorded in a result. */
  export type NormalizedSource = {
    readonly include: readonly t.StringPath[];
    readonly exclude: readonly t.StringPath[];
  };

  /** Formatting options for source statistics. */
  export type FormatOptions = {
    /**
     * Available terminal width in cells; defaults to the active terminal or 80 columns.
     * Trailing scope/pattern detail is clipped or omitted before labels and metrics.
     */
    readonly width?: number;
    /** Terminal-output override used for deterministic hyperlink rendering. */
    readonly terminal?: boolean;
    /** Optional persisted graph artifact rendered with the source statistics. */
    readonly graph?: t.WorkspaceGraph.Snapshot.Artifact;
  };

  /** Optional totals to compute. */
  export type Totals = {
    /** Include an aggregate line count. */
    readonly lines?: boolean;
  };

  /** Arguments for raw glob statistics. */
  export type GlobArgs = {
    /** Working directory used to resolve source globs. */
    readonly cwd?: t.StringDir;
    /** Package selection is unavailable in raw-glob mode. */
    readonly packages?: never;
    /** Working-directory-relative source policy. */
    readonly source: GlobSource;
    /** Optional totals to compute. */
    readonly totals?: Totals;
  };

  /** Workspace package selection. */
  export type PackageSelection = {
    /** Workspace manifest path relative to the working directory. */
    readonly workspace: t.StringPath;
    /** Single scoped package-name prefix. */
    readonly scope: string;
  };

  /** Arguments for package-scoped statistics. */
  export type PackageArgs = {
    /** Working directory used to resolve the workspace manifest. */
    readonly cwd?: t.StringDir;
    /** Workspace package selection. */
    readonly packages: PackageSelection;
    /** Package-root-relative source policy. */
    readonly source: PackageSource;
    /** Optional totals to compute. */
    readonly totals?: Totals;
  };

  /** Arguments for workspace source statistics. */
  export type StatsArgs = GlobArgs | PackageArgs;

  /** Runtime versions included in the stats result. */
  export type Runtime = {
    /** Deno runtime version. */
    readonly deno: string;
    /** TypeScript version bundled with Deno. */
    readonly typescript: string;
    /** V8 version bundled with Deno. */
    readonly v8: string;
  };

  /** Matched line classification kind. */
  export type LineKind = 'source' | 'unit-test' | 'ui-spec-test';

  /** Path classification rule for non-source line kinds. */
  export type TestPathRule = {
    /** Line kind returned when this rule matches. */
    readonly kind: Exclude<LineKind, 'source'>;
    /** Basename patterns that classify a matched file. */
    readonly basenamePatterns?: readonly RegExp[];
    /** Directory segment rules that classify a matched file. */
    readonly directorySegments?: {
      /** Exact directory segment names. */
      readonly exact?: readonly string[];
      /** Directory segment prefixes, including their intended delimiter. */
      readonly prefixes?: readonly string[];
    };
  };

  /** Default workspace info policy. */
  export type Defaults = {
    /** Ordered path classification rules. */
    readonly testPathRules: readonly TestPathRule[];
  };

  /** Matched physical line count partition. */
  export type LineBreakdown = {
    /** Physical lines in matched files not classified as test-owned. */
    readonly source: number;
    /** Physical lines in matched files classified as conventional tests. */
    readonly unitTests: number;
    /** Physical lines in matched files classified as UI/dev-harness specs. */
    readonly uiSpecTests: number;
  };

  /** Shared aggregate statistics result. */
  export type StatsBase = {
    /** Runtime versions used for the scan. */
    readonly runtime: Runtime;
    /** Normalized source globs used for the scan. */
    readonly source: NormalizedSource;
    /** Number of unique files matched. */
    readonly files: number;
    /** Aggregate line count when requested. */
    readonly lines?: number;
    /** Optional partition of the aggregate line count. */
    readonly lineBreakdown?: LineBreakdown;
  };

  /** Raw glob statistics result. */
  export type GlobResult = StatsBase & {
    readonly kind: 'glob';
    readonly selection?: never;
    readonly packages?: never;
  };

  /** Selected package identity. */
  export type PackageIdentity = {
    readonly name: t.StringPkgName;
    readonly path: t.StringDir;
  };

  /** Package-scoped statistics result. */
  export type PackageResult = StatsBase & {
    readonly kind: 'package';
    readonly selection: PackageSelection;
    readonly packages: readonly PackageIdentity[];
  };

  /** Aggregate source statistics result. */
  export type StatsResult = GlobResult | PackageResult;
}
