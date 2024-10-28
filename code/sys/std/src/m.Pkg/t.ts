import type { t } from './common.ts';

/**
 * Tools for working with the system standard
 * {pkg} "package" meta-data structure.
 */
export type PkgLib = {
  toString(input?: t.Pkg): string;
};
