import type { t } from './common.ts';

type O = Record<string, unknown>;

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
  toString(input?: t.Pkg, suffix?: string): string;

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

/**
 * Boolean tests on a {pkg} structure.
 */
export type PkgIsLib = {
  /** Determines if the input is a string of the default "unknown" */
  unknown(input?: string | t.Pkg): boolean;

  /** Determine if the given input is a `Pkg` */
  pkg(input: unknown): input is t.Pkg;

  /** Determine if the given input is a `DistPkg` */
  dist(input: unknown): input is t.DistPkg;
};

/**
 * Tools for working with "distribution-package"
 * ie. an ESM output typically written to a `/dist` folder.
 */
export type PkgDistLib = {
  fetch(options?: t.PkgDistFetchOptions): Promise<PkgDistFetchResponse>;
};

/** Options passed to the [Pkg.Dist.fetch] method. */
export type PkgDistFetchOptions = {
  dispose$?: t.UntilObservable;
  disposeReason?: string;
  origin?: string;
  pathname?: string;
};

/** Response returned from the [Pkg.Dist.fetch] method. */
export type PkgDistFetchResponse = {
  readonly ok: boolean;
  readonly status: number;
  readonly dist?: t.DistPkg;
  readonly error?: t.StdError;
};
