import type { t } from './common.ts';

/**
 * Tools for working with "distribution-package"
 * ie. an ESM output typically written to a `/dist` folder.
 */
export type PkgDistLib = {
  /** Type guards. */
  readonly Is: PkgDistIsLib;

  /** HTTP fetch the `dist.json` file. */
  fetch(options?: t.PkgDistFetchOptions | t.StringUrl): Promise<PkgDistFetchResponse>;
};

/**
 * Type guards:
 */
export type PkgDistIsLib = {
  /** Determine if the given path represents a commoly known /pkg/ path pattern. */
  codePath(path: t.StringPath): boolean;
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
