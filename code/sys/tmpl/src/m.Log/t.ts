import type { t } from './common.ts';

/**
 * Library for converting a Tmpl to console/log output.
 */
export type TmplLogLib = {
  /** Convert a set of template operations to a console table. */
  table(ops: t.TmplFileOperation[], options?: { indent?: number; hideExcluded?: boolean }): string;
};
