import type { t } from './common.ts';

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
  /**
   * Start the development server.
   */
  dev(options?: t.VitePressDevOptions | t.StringPath): Promise<t.VitePressDevServer>;

  /**
   * Run the VitePress `build` command to produce the output `/dist` bundle.
   */
  build(args: t.VitePressBuildArgs): Promise<t.VitePressBuildResponse>;
};

/** Options passed to the [VitePress.dev] method. */
export type VitePressDevOptions = {
  dispose$?: t.UntilObservable;
  pkg?: t.Pkg;
  port?: number;
  path?: t.StringPath;
};

/**
 * A running [VitePress] development server running on localhost.
 */
export type VitePressDevServer = t.LifecycleAsync & {
  readonly proc: t.CmdProcessHandle;
  readonly port: number;
  readonly path: t.StringPath;
  readonly url: t.StringUrl;
  listen(): Promise<void>;
  keyboard(): Promise<void>;
};

/** Arguments passed to the [VitePress.build] method. */
export type VitePressBuildArgs = {};

/** Response from the [VitePress.build] method. */
export type VitePressBuildResponse = {};
