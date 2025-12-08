import type { t } from './common.ts';

/**
 * Distinct structural checks the linter can perform.
 * Runtime tuple is the source of truth; `LintFacet` derives from it.
 */
export const DocLintFacets = ['aliases', 'sequence:filepaths', 'sequence:schema'] as const;
export type DocLintFacet = (typeof DocLintFacets)[number];

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
