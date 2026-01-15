import type { StringId } from '@sys/types';

export type * from './t.files.ts';

/**
 * Distinct structural checks the linter can perform.
 * Runtime tuple is the source of truth; `LintFacet` derives from it.
 */
export const LintDocFacets = [
  'aliases',
  'sequence:schema',
  'sequence:file:video',
  'sequence:file:image',
  'sequence:files:bundle',
] as const;

export type DocLintFacet = (typeof LintDocFacets)[number];

export type LintSeverity = 'error' | 'warning' | 'info';

export type LintIssue<K extends string = string> = {
  readonly kind: K;
  readonly message: string;
  readonly severity?: LintSeverity;
  readonly path?: string;
};

export type LintAggregateResult<I extends LintIssue = LintIssue> = {
  readonly ok: boolean;
  readonly issues: readonly I[];
  readonly facets: readonly string[];
};

export type DocLintIssue<K extends string = string> = LintIssue<K> & {
  readonly doc: { readonly id: StringId };
};

export type DocLintResult<K extends string = string> = {
  readonly ok: boolean;
  readonly issues: readonly DocLintIssue<K>[];
  readonly facets: readonly DocLintFacet[];
};
