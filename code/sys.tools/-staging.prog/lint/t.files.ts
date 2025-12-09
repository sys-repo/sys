import type { t } from './common.ts';

/**
 * File-path lint types.
 */
export type LintSequenceFilepathKind = 'video-path:not-found' | 'image-path:not-found';
export type LintSequenceFilepath = t.DocLintIssue<LintSequenceFilepathKind> & {
  readonly raw: string;
  readonly resolvedPath: string;
  readonly closestMatch?: string;
};

/** The result of a file-path linter run. */
export type LintSequenceFilepathResult = t.LintResult<LintSequenceFilepathKind>;

/**
 * Callback invoked for each media path discovered in a slug.
 */
export type LintMediaWalkVisitor = (args: LintMediaWalkArgs) => void | Promise<void>;
/** A single media-path observation during a slug walk. */
export type LintMediaWalkArgs = {
  readonly kind: t.SlugAssetKind; // 'video' | 'image'
  readonly raw: string; // Original value from YAML
  readonly resolvedPath: string; // Concrete path after alias + tilde resolution
  readonly exists: boolean; // Whether the file exists on disk
  readonly error?: unknown; // Resolution error, if any
};
