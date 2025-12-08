/**
 * Distinct structural checks the linter can perform.
 * Runtime tuple is the source of truth; `LintFacet` derives from it.
 */
export const DocLintFacets = ['aliases', 'sequence:filepaths', 'sequence:schema'] as const;
export type DocLintFacet = (typeof DocLintFacets)[number];
