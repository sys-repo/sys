import { type t } from './common.ts';

export type AliasLintKind =
  | 'value-leading-slash'
  | 'index-not-crdt-id'
  | 'index-has-alias-segment'
  | 'index-alias-fragment';

/**
 * Alias-specific lint issue:
 * extends the shared `LintIssue` with key/value context.
 */
export type AliasLint = t.SlugLintIssue<AliasLintKind> & {
  readonly key: t.Alias.Key;
  readonly value: string;
};

/**
 * Concrete result type for this linter.
 */
export type AliasLintResult = t.SlugLintResult<AliasLintKind> & {
  readonly issues: readonly AliasLint[];
};

const FACETS = ['aliases'] as const;
const finalize = (issues: readonly AliasLint[]): AliasLintResult => ({
  ok: issues.length === 0,
  facets: [...FACETS],
  issues,
});

/**
 * Pure linter for a single alias table.
 *
 * Rules (current domain rules):
 *  - No leading "/" in alias values (we want composable alias chains).
 *  - If ":index" is present:
 *      • value must be a bare "crdt:<id>" (no extra segments),
 *      • must not contain "/alias".
 *  - No legacy ":index/alias/..." fragments in *any* alias value.
 */
export function lintAliases(docid: t.Crdt.Id, map: t.Alias.Map): AliasLintResult {
  const issues: AliasLint[] = [];

  const entries = Object.entries(map ?? {}) as [string, unknown][];

  for (const [rawKey, rawValue] of entries) {
    const key = rawKey as t.Alias.Key;

    if (typeof rawValue !== 'string') {
      // Table-shape/type problems are handled by AliasResolver.analyze.
      continue;
    }

    const value = rawValue.trim();

    /**
     * 1) Leading "/" in alias values (we want symbolic chains, not pseudo-absolute).
     */
    if (value.startsWith('/')) {
      issues.push({
        kind: 'value-leading-slash',
        key,
        value,
        message:
          'Alias value should not start with "/". Use composable alias chains like ":index/:assets/..." instead.',
        doc: { id: docid },
      });
    }

    /**
     * 2) :index semantics:
     *    - must be a bare "crdt:<id>"
     *    - must not contain "/alias" or any extra path segments.
     */
    if (key === ':index') {
      if (value.includes('/alias')) {
        issues.push({
          kind: 'index-has-alias-segment',
          key,
          value,
          message:
            '":index" must be a bare CRDT id and must not contain "/alias" or extra segments.',
          doc: { id: docid },
        });
      }

      const isBareCrdtId = /^crdt:[A-Za-z0-9]+$/.test(value);
      if (!isBareCrdtId) {
        issues.push({
          kind: 'index-not-crdt-id',
          key,
          value,
          message: '":index" must be a bare "crdt:<id>" document identifier.',
          doc: { id: docid },
        });
      }
    }

    /**
     * 3) Legacy ":index/alias/…" hop fragments anywhere in the table.
     */
    if (value.includes(':index/alias')) {
      issues.push({
        kind: 'index-alias-fragment',
        key,
        value,
        message:
          'Legacy pattern ":index/alias/…" found. Replace with ":index/:core", ":index/:assets/…", etc. No "/alias" segment.',
        doc: { id: docid },
      });
    }
  }

  return finalize(issues);
}
