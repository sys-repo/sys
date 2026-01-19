import type { t } from './common.ts';

/**
 * File-path lint types.
 *
 * These describe issues discovered when resolving media paths
 * (video/image) referenced in a sequence.
 *
 * Includes a sequence-level playback export failure which is
 * surfaced via the same lint channel for convenience.
 */
export type LintSequenceFilepathKind =
  | 'video-path:not-found'
  | 'image-path:not-found'
  | 'sequence:playback:not-exported'
  | 'sequence:assets:not-exported'
  | 'sequence:slug-tree:not-exported';

/**
 * A single filepath lint issue.
 *
 * - `raw`: original path from YAML
 * - `resolvedPath`: fully resolved filesystem path
 * - `closestMatch`: optional suggestion for misspellings / nearby files
 */
export type LintSequenceFilepath = t.DocLintIssue<LintSequenceFilepathKind> & {
  readonly raw: string;
  readonly resolvedPath: string;
  readonly closestMatch?: string;
};

/**
 * Aggregate result for a filepath lint run.
 *
 * This is pure lint metadata: no bundling, no slug-specific output dirs.
 */
export type LintSequenceFilepathResult = {
  readonly issues: readonly LintSequenceFilepath[];
};

/**
 * Callback invoked for each media reference encountered while walking
 * a slug’s sequence.
 *
 * A linter may use this to record issues or collect stats.
 */
export type LintMediaWalkVisitor = (args: LintMediaWalkArgs) => void | Promise<void>;

/**
 * Observation for a single media path in a slug.
 *
 * - `kind`: media category ('video' | 'image')
 * - `raw`: raw YAML value
 * - `resolvedPath`: after alias/tilde resolution
 * - `exists`: whether the file exists on disk
 * - `error`: resolution failure, if any
 */
export type LintMediaWalkArgs = {
  readonly kind: t.SlugAssetKind;
  readonly raw: string;
  readonly resolvedPath: string;
  readonly exists: boolean;
  readonly error?: unknown;
};

/**
 * Combined result for "lint + bundle" when emitting assets.
 *
 * Keeps the same shape as a lint result, with an added `dir` block
 * describing where bundle artefacts were written.
 */
export type LintAndBundleResult = LintSequenceFilepathResult & {
  readonly dir: {
    readonly base: t.StringDir;
    readonly manifests: t.StringDir;
    readonly video: t.StringDir;
    readonly image: t.StringDir;
  };
};
