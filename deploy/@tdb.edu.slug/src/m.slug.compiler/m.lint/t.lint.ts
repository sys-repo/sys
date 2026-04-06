import type { t } from './common.ts';

/** Supported lint severities. */
export type LintSeverity = 'error' | 'warning' | 'info';
/** Generic lint issue record. */
export type LintIssue<K extends string = string> = {
  readonly kind: K;
  readonly message: string;
  readonly severity?: t.LintSeverity;
  readonly path?: string;
};
