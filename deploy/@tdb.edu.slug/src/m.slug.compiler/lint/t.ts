import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.files.ts';
export type * from './t.tree.ts';

/**
 * Distinct structural checks the linter can perform.
 * Runtime tuple is the source of truth; `LintFacet` derives from it.
 */
export const SlugLintFacets = [
  'aliases',
  'sequence:schema',
  'sequence:file:video',
  'sequence:file:image',
  'sequence:files:bundle',
  'slug-tree:fs',
] as const;
export type SlugLintFacet = (typeof SlugLintFacets)[number];

/**
 * Linter configuration.
 */
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

export type SlugLintIssue<K extends string = string> = LintIssue<K> & {
  readonly doc: { readonly id: t.StringId };
};

export type SlugLintResult<K extends string = string> = {
  readonly ok: boolean;
  readonly issues: readonly SlugLintIssue<K>[];
  readonly facets: readonly SlugLintFacet[];
};

/** YAML-authored lint profile document. */
export type SlugLintProfile = {
  /** Lint facets to run. */
  readonly facets?: readonly SlugLintFacet[];
  /** Slug-tree filesystem lint configuration. */
  readonly 'slug-tree:fs'?: t.LintProfileSlugTree;
};
