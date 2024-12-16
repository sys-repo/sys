import type { t } from './common.ts';

/**
 * Library for converting a Tmpl to console/log output.
 */
export type TmplLogLib = {
  /** Log helpers for working with template operations. */
  ops(ops: t.TmplFileOperation[]): t.TmplLogOps;
};

/**
 * Log helpers for a list of template/file operations.
 */
export type TmplLogOps = {
  /** The operations being logged. */
  readonly ops: t.TmplFileOperation[];

  /** Convert a set of template operations to a console table. */
  table(options?: { indent?: number }): t.CliTable;
};
