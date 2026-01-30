import type { t } from './common.ts';

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
  'fs:slug-tree',
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
  readonly doc: { readonly id: t.StringId };
};

export type DocLintResult<K extends string = string> = {
  readonly ok: boolean;
  readonly issues: readonly DocLintIssue<K>[];
  readonly facets: readonly DocLintFacet[];
};

/** YAML-authored lint profile document. */
export type LintProfileDoc = {
  /** Lint facets to run. */
  readonly facets?: readonly DocLintFacet[];
  /** Slug-tree filesystem lint configuration. */
  readonly 'fs:slug-tree'?: LintProfileSlugTree;
};

/** Slug-tree filesystem lint settings. */
export type LintProfileSlugTree = {
  /** Source directory to scan. */
  readonly source?: t.StringPath;
  /** Targets for generated artifacts. */
  readonly target?: LintProfileSlugTreeTarget;
  /** File extensions to include (e.g. ".md"). */
  readonly include?: readonly string[];
  /** Directory entries to ignore. */
  readonly ignore?: readonly string[];
  /** Sort directory entries by name. */
  readonly sort?: boolean;
  /** Treat README.md as the directory slug. */
  readonly readmeAsIndex?: boolean;
};

export type LintProfileSlugTreeTarget = {
  /** Manifest targets for generated artifacts. */
  readonly manifest?: t.StringPath | readonly t.StringPath[];
  /** Optional directory to copy source content into. */
  readonly dir?: t.StringPath;
  /** Optional CRDT write target. */
  readonly crdt?: {
    readonly ref?: t.StringRef;
    readonly path?: t.StringPath;
  };
};
