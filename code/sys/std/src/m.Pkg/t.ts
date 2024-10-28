import type { t } from './common.ts';

/**
 * Tools for working with the system standard
 * {pkg} "package" meta-data structure.
 */
export type PkgLib = {
  /* Boolean flag tests related to the {pkg} meta-data. */
  readonly Is: t.PkgIs;

  /* Convert a {pkg} into a display string. */
  toString(input?: t.Pkg): string;
};

/**
 * Boolean tests on a {pkg} structure.
 */
export type PkgIs = {
  /* Determines if the input is a string of the default "unknown" */
  unknown(input?: string): boolean;
};
