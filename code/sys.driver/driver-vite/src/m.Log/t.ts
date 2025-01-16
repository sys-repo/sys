import type { t } from '../common.ts';

/**
 * Tools for logging common Vite related output.
 */
export type ViteLogLib = {
  /** Log bundled distribution details. */
  readonly Bundle: ViteLogBundleLib;

  /** Log pkg/module details. */
  readonly Module: t.ViteLogModuleLib;

  /** Log the common "dev/build/serve" API.  */
  readonly UsageAPI: t.ViteLogUsageApi;

  /** Helper for padding an output string. */
  pad(text: string, pad?: boolean): string;

  /** Format the digest-hash */
  digest(hash?: t.StringHash): string;
};

/**
 * Log the common "dev/build/serve" API.
 */
export type ViteLogUsageApi = {
  /** Render to console. */
  log(args?: t.ViteLogUsageApiArgs): void;
};
export type ViteLogUsageApiArgs = { cmd?: string; minimal?: boolean };

/**
 * Log bundled distribution details.
 */
export type ViteLogBundleLib = {
  /** Render to console. */
  log(args: t.ViteLogBundleArgs): void;

  /** Produce bundle log string. */
  toString(args: t.ViteLogBundleArgs): string;
};

/**
 * Log pkg/module details.
 */
export type ViteLogModuleLib = {
  log(pkg: t.Pkg): void;
  toString(pkg: t.Pkg): string;
};

/**
 * Arguments passed to the pkg/bundle logging helper.
 */
export type ViteLogBundleArgs = {
  ok: boolean;
  bytes: number;
  dirs: t.ViteBundleDirs;
  pkg?: t.Pkg;
  hash?: t.StringHash;
  elapsed?: t.Msecs;
  pad?: boolean;
};

/**
 * Arguments passed to the Dev logging helper.
 */
export type ViteLogDevArgs = {
  inDir?: t.StringDir;
  pkg?: t.Pkg;
};
