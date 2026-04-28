import type { t } from './common.ts';

/**
 * Options passed to the `Vite.Config.app` method.
 */
export type ViteConfigAppOptions = {
  paths?: t.ViteConfigPaths;

  /**
   * Enabled deno workspace support.
   *
   * - (default: enabled: walks up to find first available workspace `deno.json` file.)
   * - pass a specific `deno.json` file string if in a non-standard place.
   * - pass `false` to disable workspace {alias} mapping.
   */
  workspace?: boolean | t.DenoFilePath;

  /**
   * ƒ(🌳): Filter to apply to the workspace modules
   *       (default: nothing filtered → ie. the entire monorepo is available for `import`).
   */
  filter?: t.WorkspaceFilter;

  /**
   * Chuck a named module into it's own bundle.
   */
  chunks?: t.ViteModuleChunks;

  /**
   * Flag indicating if the output should be minified.
   * Useful for debugging the output.
   * Default: true.
   */
  minify?: boolean;

  /**
   * Common plugins to include (default true).
   */
  plugins?: t.ViteConfigCommonPlugins;

  /**
   * Additional caller-supplied Vite plugins.
   * These are appended after the driver/common plugin set and before any terminal plugins
   * managed by the driver (for example the visualizer).
   */
  vitePlugins?: t.VitePluginOption[];

  /**
   * Canonical pass-through for Vite's OXC transform configuration.
   *
   * Defaults to `false` for @sys app configs because Vite 8's OXC/Rolldown
   * native transform path is not yet stable under Deno/NPM temp workspaces.
   * Pass an OXC options object to opt into Vite's native transform path.
   */
  oxc?: t.ViteUserConfig['oxc'];

  /**
   * Canonical pass-through for Vite dependency-optimizer configuration.
   *
   * This packet intentionally exposes Vite's native surface without adding
   * driver-owned heuristic defaults.
   */
  optimizeDeps?: t.ViteUserConfig['optimizeDeps'];

  /**
   * Flag indicating if the `rollup-plugin-visualizer` should be applied to the bundle.
   * Out to (default) `dist/stats.html` or the path provided.
   */
  visualizer?: boolean | t.StringPath;
};
