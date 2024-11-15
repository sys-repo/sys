import type { t } from './common.ts';

type ToStringOptions = { pad?: boolean };

/**
 * Tools for working with the "VitePress" documentation bundle compiler.
 * https://vitepress.dev/
 *
 * The "VitePress" documentation [Markdown → HTML/JS] vite bundler
 * is in the category of a SSGs "static-site-generator."
 *
 * This lightweight process wrapper makes the Vite/VitePress
 * "live development" (HMR) and build/bundle commands reliably
 * invokeable programmatically in places like CI, or your own
 * extension module.
 */
export type VitePressLib = {
  /** Tools for maintaining the "Editor Machine/Device" environment. */
  readonly Env: VitePressEnvLib;

  /** Initialize the local machine environment. */
  init: t.VitePressEnvLib['init'];

  /**
   * Start the development server.
   * https://vitepress.dev/reference/cli#vitepress-dev
   */
  dev(options?: t.VitePressDevArgs | t.StringDir): Promise<t.VitePressDevServer>;

  /**
   * Run the VitePress `build` command to produce the output `/dist` bundle.
   * https://vitepress.dev/reference/cli#vitepress-build
   */
  build(options?: t.VitePressBuildArgs | t.StringDir): Promise<t.VitePressBuildResponse>;
};

/** Options passed to the [VitePress.dev] method. */
export type VitePressDevArgs = {
  /** Path to the input directory. */
  inDir?: t.StringDir;

  /** Package meta-data. */
  pkg?: t.Pkg;

  /** Port to attempt to start the dev server on. */
  port?: number;

  /** Flag indicating if the browser should be automatically opened. Default: true.  */
  open?: boolean;

  /** Stop the dev server. */
  dispose$?: t.UntilObservable;
};

/**
 * A running [VitePress] development server running on localhost.
 */
export type VitePressDevServer = t.LifecycleAsync & {
  readonly proc: t.CmdProcessHandle;
  readonly port: number;
  readonly dirs: Omit<t.ViteBundleDirs, 'out'>;
  readonly url: t.StringUrl;
  listen(): Promise<void>;
  keyboard(): Promise<void>;
};

/** Arguments passed to the [VitePress.build] method. */
export type VitePressBuildArgs = {
  pkg?: t.Pkg; // Consumer module.
  inDir?: t.StringDir;
  outDir?: t.StringDir;
  srcDir?: t.StringDir;
  silent?: boolean;
};

/** Response from the [VitePress.build] method. */
export type VitePressBuildResponse = {
  ok: boolean;
  elapsed: t.Msecs;
  dirs: t.ViteBundleDirs;
  dist: t.DistPkg;
  toString(options?: ToStringOptions): string;
};

/**
 * Tools for maintaining the local "Editor Machine/Device" environment state.
 */
export type VitePressEnvLib = {
  /**
   * Initialize the local machine environment.
   */
  init(args?: t.VitePressEnvInitArgs): Promise<void>;
};

export type VitePressEnvInitArgs = {
  force?: boolean;
  inDir?: t.StringDir;
  srcDir?: t.StringDir;
  silent?: boolean;
};
