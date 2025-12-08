import type { t } from '../common.ts';

/**
 * Single doc-scoped lint issue:
 * - Extends the generic LintIssue
 * - Always carries the owning document id.
 */
export type DocLintIssue<K extends string = string> = t.LintIssue<K> & {
  readonly doc: { readonly id: t.Crdt.Id };
};

/**
 * Combined lint result for a set of doc-scoped issues.
 */
export type DocLintResult<K extends string = string> = t.LintAggregateResult<DocLintIssue<K>>;
