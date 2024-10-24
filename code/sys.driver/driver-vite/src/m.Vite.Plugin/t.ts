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
   * that draws together react-swc, emotion-style, and deno-workspace support.
   */
  common(options?: t.CommonPluginOptions): Promise<t.VitePluginOption[]>;
};

export type CommonPluginOptions = {
  workspace?: boolean | t.WorkspacePluginOptions;
  react?: boolean;
  wasm?: boolean;
};

/**
 * A Vite plugin that prepares configuration with "standard/common" setup.
 */
export type WorkspacePlugin = VitePlugin & {
  info: { ws?: t.ViteDenoWorkspace };
};

/**
 * Options passed to the workspace-plugin.
 */
export type WorkspacePluginOptions = {
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
};
