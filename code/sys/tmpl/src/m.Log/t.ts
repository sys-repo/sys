import type { t } from './common.ts';

/**
 * Library for converting a Tmpl to console/log output.
 */
export type TmplLogLib = {
  /**
   * Convert a set of template operations to a console table.
   */
  table(ops: t.TmplFileOperation[], options?: t.TmplLogTableOptions): string;
};

/** Options passed to the `Tmpl.Log.table` method. */
export type TmplLogTableOptions = {
  indent?: number;
  hideExcluded?: boolean;
  trimPathLeft?: t.StringPath;
  note?: (op: t.TmplFileOperation) => string | void;
};
