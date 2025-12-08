import type { t } from './common.ts';

/**
 * Optional severity for an issue.
 */
export type LintSeverity = 'error' | 'warning' | 'info';

/**
 * Base issue shape: specific linters refine `K` and can intersect extra fields.
 */
export type LintIssue<K extends string = string> = {
  /** Machine-readable kind/code, eg: "path:missing". */
  readonly kind: K;

  /** Human-readable message. */
  readonly message: string;

  /** Optional severity. Defaults to "error" by convention if omitted. */
  readonly severity?: LintSeverity;

  /** Optional location (eg: file path, JSON path, YAML path). */
  readonly path?: string;
};

/**
 * Result of running a single linter in its simplest form.
 * Just the list of issues, no summary/ok flags.
 */
export type LintResult<K extends string = string> = {
  readonly issues: readonly LintIssue<K>[];
};

/**
 * Generic aggregated lint result with summary metadata.
 */
export type LintAggregateResult<I extends LintIssue = LintIssue> = {
  readonly ok: boolean;
  readonly total: { readonly issues: number };
  readonly issues: readonly I[];
};
