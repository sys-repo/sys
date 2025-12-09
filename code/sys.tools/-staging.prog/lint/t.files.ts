import type { t } from './common.ts';

/**
 * File-path lint types.
 */
export type SequenceFilepathLintKind = 'video-path:not-found' | 'image-path:not-found';
export type SequenceFilepathLint = t.DocLintIssue<SequenceFilepathLintKind> & {
  readonly raw: string;
  readonly resolvedPath: string;
  readonly closestMatch?: string;
};

/** The result of a file-path linter run. */
export type SequenceFilepathLintResult = t.LintResult<SequenceFilepathLintKind>;
