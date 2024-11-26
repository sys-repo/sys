import type { t } from './common.ts';

type VitePlugin = {
  name: string;
  config(config: t.ViteUserConfig, env: t.ViteConfigEnv): Omit<t.ViteUserConfig, 'plugins'>;
};

/**
 * Index of Vite plugins.
 */
export type VitePluginLib = {
  /**
   * A plugin that configures the project to run in a child-process.
   * Use this within a `vite.config.ts` in the root of the host project.
   */
  workspace(options?: t.WorkspacePluginOptions): Promise<t.WorkspacePlugin>;
  workspace(filter: t.WorkspaceFilter): Promise<t.WorkspacePlugin>;

  /**
   * A composite plugin that allow for a minimal configuration within `vite.config.ts`
   * that draws together react-swc, emotion-style, wasm, and the [deno-workspace] support.
   */
  common(options?: t.CommonPluginsOptions): Promise<t.ViteUserConfig>;
};

export type CommonPluginsOptions = t.WorkspacePluginOptions & {
  /** Flag indicating if the "react+swc" plugin whould be included. */
  react?: boolean;

  /** Flag indicating if the "wasm" plugin whould be included. */
  wasm?: boolean;

  /** Flag indicating if the workspace plugin should be loaded (default:true). */
  workspace?: boolean;
};

/**
 * A Vite plugin that prepares configuration with "standard/common" setup.
 */
export type WorkspacePlugin = VitePlugin & {
  info: { ws?: t.ViteDenoWorkspace; pkg?: t.Pkg };
};

/**
 * Options passed to the workspace-plugin.
 */
export type WorkspacePluginOptions = {
  pkg?: t.Pkg;

  /**
   * Enabled deno workspace support.
   *
   * - (default: enabled: walks up to find first available workspace `deno.json` file.)
   * - pass a specific `deno.json` file string if in a non-standard place.
   * - pass `false` to disable workspace {alias} mapping.
   */
  workspace?: boolean | t.DenofilePath;

  /**
   * ƒ(🌳): Filter to apply to the workspace modules
   *       (default: nothing filtered → ie. the entire monorepo is available for `import`).
   */
  filter?: t.WorkspaceFilter;

  /**
   * ƒ(🌳): Callback to mutate the generated Vite configuration before
   *        it is passed on to the next step in the bundle pipeline
   */
  mutate?: t.ViteConfigMutate;

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
};

/**
 * Handler for declaring how to chunk a module.
 */
export type ViteModuleChunks = (e: ViteModuleChunksArgs) => void;

/**
 * Arguments passed to the chunk method.
 */
export type ViteModuleChunksArgs = {
  chunk(alias: string, moduleName?: string | string[]): ViteModuleChunksArgs;
};
