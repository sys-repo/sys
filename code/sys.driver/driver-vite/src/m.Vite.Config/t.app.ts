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
};
