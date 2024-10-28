import type { t } from './common.ts';

type O = Record<string, unknown>;

/**
 * Tools for working with the system standard
 * {pkg} "package" meta-data structure.
 */
export type PkgLib = {
  /* Boolean flag tests related to the {pkg} meta-data. */
  readonly Is: t.PkgIs;

  /* Convert a {pkg} into a display string. */
  toString(input?: t.Pkg): string;

  /**
   * Convert a JSON import to a simple <Pkg> structure.
   * @example
   *
   * ```ts
   * import { Pkg } from '@sys/std';
   * import { default as deno } from '../deno.json' with { type: 'json' };
   * export const pkg = Pkg.fromJson(deno);
   * ```
   */
  fromJson(input: O): t.Pkg;
};

/**
 * Boolean tests on a {pkg} structure.
 */
export type PkgIs = {
  /* Determines if the input is a string of the default "unknown" */
  unknown(input?: string | t.Pkg): boolean;
};
