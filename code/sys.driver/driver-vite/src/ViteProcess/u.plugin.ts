import { Path, ViteConfig, type t } from './common.ts';

/**
 * Configuration plugin.
 */
export const workspacePlugin: t.WorkspacePluginFactory = async (args) => {
  const path = args?.workspace;
  const workspace = await ViteConfig.workspace(path);
  if (!workspace.exists) {
    throw new Error(`A workspace could not be found: ${path ?? Path.resolve('.')}`);
  }

  /**
   * Workspace plugin.
   */
  const plugin: t.WorkspacePlugin = {
    name: 'vite-plugin-workspace',
    workspace,

    /**
     * Modify vite config before it's resolved.
     */
    config(config: t.ViteUserConfig, env: t.ViteConfigEnv) {
      const input = wrangle.path('VITE_INPUT');
      const outDir = wrangle.path('VITE_OUTDIR');
      const root = Path.dirname(input);

      /**
       * Base
       */
      config.root = root;
      config.base = './'; // NB: relative pathing within bundled assets, eg: src="./main...

      /**
       * Server
       */
      const server = config.server || (config.server = {});
      server.fs = { allow: ['..'] }; // NB: allows stepping up out of the {CWD} and access other folders in the mono-repo.

      /**
       * Module resolution (monorepo).
       */
      const resolve = config.resolve || (config.resolve = {});
      resolve.alias = workspace.resolution.aliases;

      /**
       * Build: Rollup Options.
       */
      const build = config.build || (config.build = {});
      build.emptyOutDir = true;
      build.outDir = Path.relative(root, outDir);
      build.rollupOptions = {
        input,
        output: {
          entryFileNames: 'assets/-entry.[hash].js',
          chunkFileNames: 'assets/c.[hash].js', //     |←  c.<hash> == "code/chunk"
          assetFileNames: 'assets/a.[hash].[ext]', //  |←  a.<hash> == "asset"
        },
      };

      /**
       * Run callback for any further modifications to the Vite config.
       * Directly manipulate the {config} parameter object.
       */
      args?.mutate?.({ config, env, workspace });
      return config;
    },
  };
  return plugin;
};

/**
 * Helpers
 */
const wrangle = {
  path(envKey: string) {
    const path = Deno.env.get(envKey) ?? '';
    if (!path) throw new Error(`Path at env-key "${envKey}" not found`);
    return Path.resolve(path);
  },
} as const;
