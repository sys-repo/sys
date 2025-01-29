import type { t } from './common.ts';

type ToStringOptions = { pad?: boolean };

/**
 * Tools for working with the "VitePress" documentation bundle compiler.
 * https://vitepress.dev
 *
 * The "VitePress" documentation [Markdown → HTML/JS] vite bundler
 * is in the category of a SSGs "static-site-generator."
 *
 * This lightweight process wrapper makes the Vite/VitePress
 * "live development" (HMR) and build/bundle commands reliably
 * invokeable programmatically in places like CI, or your own
 * extension module.
 */
export type VitepressLib = {
  /** Tools for maintaining the "Editor Machine/Device" environment. */
  readonly Env: t.VitepressEnvLib;

  /** Template library for a VitePress project. */
  readonly Tmpl: t.VitepressTmplLib;

  /**
   * Start the development server.
   * https://vitepress.dev/reference/cli#vitepress-dev
   */
  dev(options?: t.VitepressDevArgs | t.StringDir): Promise<t.VitepressDevServer>;

  /**
   * Run the VitePress `build` command to produce the output `/dist` bundle.
   * https://vitepress.dev/reference/cli#vitepress-build
   */
  build(options?: t.VitepressBuildArgs | t.StringDir): Promise<t.VitepressBuildResponse>;
};

/** Options passed to the [VitePress.dev] method. */
export type VitepressDevArgs = {
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
export type VitepressDevServer = t.LifecycleAsync & {
  readonly proc: t.ProcHandle;
  readonly port: number;
  readonly dirs: Omit<t.ViteBundleDirs, 'out'>;
  readonly url: t.StringUrl;
  listen(): Promise<void>;
  keyboard(): Promise<void>;
};

/** Arguments passed to the [VitePress.build] method. */
export type VitepressBuildArgs = {
  pkg?: t.Pkg; // Consumer module.
  inDir?: t.StringDir;
  outDir?: t.StringDir;
  srcDir?: t.StringDir;
  silent?: boolean;
};

/** Response from the [VitePress.build] method. */
export type VitepressBuildResponse = {
  ok: boolean;
  elapsed: t.Msecs;
  dirs: t.ViteBundleDirs;
  dist: t.DistPkg;
  toString(options?: ToStringOptions): string;
};
