import type { t } from './common.ts';

/**
 * Tools for working with "distribution-package"
 * ie. an ESM output typically written to a `/dist` folder.
 */
export type PkgDistLib = {
  /** Type guards. */
  readonly Is: PkgDistIsLib;

  /** Legacy-compatibility helpers for dist schema evolution. */
  readonly Compat: PkgDistCompatLib;

  /** HTTP fetch the `dist.json` file. */
  fetch(options?: t.PkgDistFetchOptions | t.StringUrl): Promise<PkgDistFetchResponse>;

  /**
   * Helpers for parsing `dist.hash.parts` values, eg:
   *   "sha256-<hex>:size=<bytes>"
   *   "sha256-<hex>"
   */
  readonly Part: PkgDistPartLib;
};

/**
 * Type guards:
 */
export type PkgDistIsLib = {
  /** Determine if the given path represents a commoly known /pkg/ path pattern. */
  codePath(path: t.StringPath): boolean;
};

/**
 * Parsed information from a `dist.hash.parts[path]` string.
 */
export type PkgDistPartInfo = {
  /** Canonical hash string (eg. "sha256-..."). */
  readonly hash: t.StringHash;
  /** Optional size (bytes). */
  readonly size?: t.NumberBytes;
};

/**
 * Helpers for working with `dist.hash.parts`.
 */
export type PkgDistPartLib = {
  /** Parse a parts value into `{ hash, size }` if possible. */
  parse(value: unknown): PkgDistPartInfo | undefined;

  /** Extract only the hash (if any). */
  hash(value: unknown): t.StringHash | undefined;

  /** Extract only the size (bytes) (if any). */
  size(value: unknown): number | undefined;
};

/**
 * Compatibility helpers for legacy `dist.json` shapes.
 */
export type PkgDistCompatLib = {
  /** Determine if the given input is legacy (compat) shape (not canonical). */
  legacy(input: unknown): input is t.DistPkgLegacy;

  /**
   * Convert legacy/canonical input to canonical `DistPkg`.
   * Legacy input requires explicit `policy`.
   */
  toCanonical(
    input: unknown,
    options?: { policy?: t.StringUri },
  ): t.DistPkg | undefined;
};

/** Options passed to the [Pkg.Dist.fetch] method. */
export type PkgDistFetchOptions = {
  disposeReason?: string;
  origin?: string;
  pathname?: string;
  until?: t.UntilInput;
};

/** Response returned from the [Pkg.Dist.fetch] method. */
export type PkgDistFetchResponse = {
  readonly ok: boolean;
  readonly status: number;
  readonly href: t.StringUrl;
  readonly dist?: t.DistPkg;
  readonly error?: t.StdError;
};
