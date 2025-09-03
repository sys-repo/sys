import type { t } from './common.ts';

type StringBaseDir = t.StringDir;

/**
 * Library for converting a Tmpl to console/log output.
 */
export type TmplLogLib = {
  /** Convert a set of template operations to a console table. */
  table(ops: readonly t.TmplWriteOp[], options?: t.TmplLogTableOptions | StringBaseDir): string;

  /** Prepare a bundled log message. */
  bundled(bundle: t.FileMapBundleResult): string;
};

/** Options passed to the `Tmpl.Log.table` method. */
export type TmplLogTableOptions = {
  baseDir?: StringBaseDir;
  indent?: number;
  hideExcluded?: boolean;
  trimPathLeft?: t.StringPath;
  note?: (op: t.TmplWriteOp) => string | void;
};
