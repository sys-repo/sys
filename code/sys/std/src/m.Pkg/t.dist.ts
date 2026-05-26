import type { t } from './common.ts';

/**
 * Parsed information from a `dist.hash.parts[path]` string.
 */
export type PkgDistPartInfo = {
  /** Canonical hash string (eg. "sha256-..."). */
  readonly hash: t.StringHash;
  /** Optional size (bytes). */
  readonly size?: t.NumberBytes;
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
