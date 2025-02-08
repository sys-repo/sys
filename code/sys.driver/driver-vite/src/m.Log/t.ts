import type { t } from './common.ts';

/**
 * Tools for logging common Vite related output.
 */
export type ViteLogLib = {
  /** Log bundled distribution details. */
  readonly Bundle: ViteLogBundleLib;

  /** Log pkg/module details. */
  readonly Module: t.ViteLogModuleLib;

  /** Log a `/dist` bundle folder. */
  readonly Dist: t.ViteLogDistLib;

  /** Log the common "dev/build/serve" API.  */
  readonly API: t.ViteLogApi;

  /** Command output. */
  readonly Help: t.ViteLogHelpLib;

  /** Helper for padding an output string. */
  pad(text: string, pad?: boolean): string;

  /** Format the digest-hash */
  digest(hash?: t.StringHash): string;
};

/**
 * Log the common "dev/build/serve" (and optionally extended) API.
 */
export type ViteLogApi = {
  /** Render to console. */
  log(args?: t.ViteLogUsageApiArgs): void;
};

/** Arguments passed to `Log.API` method */
export type ViteLogUsageApiArgs = {
  cmd?: string;
  minimal?: boolean;
  disabled?: t.ViteLogApiCmd[];
};

/** Commands included in the Help log. */
export type ViteLogApiCmd = 'dev' | 'build' | 'serve' | 'upgrade' | 'backup' | 'clean' | 'help';

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

/**
 * Help output.
 */
export type ViteLogHelpLib = {
  log(args: t.ViteLogHelpArgs): Promise<void>;
};
/** Arguments passed to `VitLog.help()` method. */
export type ViteLogHelpArgs = {
  pkg?: t.Pkg;
  api?: t.ViteLogUsageApiArgs;
  in?: t.StringDir;
  out?: t.StringDir;
};

/** Log a `/dist` bundle folder. */
export type ViteLogDistLib = {
  log(dist: t.DistPkg, options: t.ViteLogDistOptions): void;
  toString(dist: t.DistPkg, options: t.ViteLogDistOptions): string;
};

/** Options passed to the `Log.Dist` method. */
export type ViteLogDistOptions = {
  ok?: boolean;
  title?: string;
  elapsed?: t.Msecs;
  dirs?: { in?: t.StringDir; out?: t.StringDir };
  pad?: boolean;
};
