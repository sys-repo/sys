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
