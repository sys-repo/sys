import type { t } from './common.ts';

type O = Record<string, unknown>;

export type * from './t.dist.ts';
export type * from './t.is.ts';

/**
 * Tools for working with the standard system
 * `{pkg}` package meta-data structure.
 */
export type PkgLib = {
  /** Boolean flag tests related to the {pkg} meta-data. */
  readonly Is: t.PkgIsLib;

  /** Tools for working with distribution packages. */
  readonly Dist: t.PkgDistLib;

  /** Convert a {pkg} into a display string. */
  toString(input?: t.Pkg, suffix?: string, options?: t.PkgToStringOptions | boolean): string;

  /**
   * Extracts the name/version from the gtiven object if found,
   * otherwise returns standard <Unknown> package.
   */
  toPkg(input?: O | string): t.Pkg;

  /**
   * Convert a JSON import to a simple <Pkg> structure.
   * @example
   *
   * ```ts
   * import { Pkg, type t } from '@sys/std';
   * import { default as deno } from '../deno.json' with { type: 'json' };
   * export const pkg: t.Pkg = Pkg.fromJson(deno);
   * ```
   */
  fromJson(input: O, defaultName?: string, defaultVersion?: t.StringSemver): t.Pkg;

  /**
   * Generate a new { \<unknown\>@0.0.0 } package object.
   */
  unknown(): t.Pkg;
};

/** Options passed to the `Pkg.toString` method. */
export type PkgToStringOptions = {
  /** Include the version in the display string - @default true */
  version?: boolean;
};
