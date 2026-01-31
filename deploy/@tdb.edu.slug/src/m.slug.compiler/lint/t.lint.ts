import { type t } from './common.ts';

export type LintSeverity = 'error' | 'warning' | 'info';

export type LintIssue<K extends string = string> = {
  readonly kind: K;
  readonly message: string;
  readonly severity?: t.LintSeverity;
  readonly path?: string;
};
