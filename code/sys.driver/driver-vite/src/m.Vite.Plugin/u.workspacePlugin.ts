import { Path, ViteConfig, type t } from './common.ts';

/**
 * Configure a deno workspace to addressable (via import) within Vite.
 */
export const workspacePlugin: t.VitePluginLib['workspace'] = async (...args: any[]) => {
  const options = wrangle.options(args);
  const ws = await wrangle.workspace(options);

  /**
   * Plugin.
   */
  const plugin: t.WorkspacePlugin = {
    name: 'vite-plugin-workspace',
    info: { ws },
    config(config, env) {
      const input = wrangle.path('VITE_INPUT');
      const outDir = wrangle.path('VITE_OUTDIR');
      const root = Path.dirname(input);

      /**
       * Base.
       */
      config.root = root;
      config.base = './'; // NB: relative pathing within bundled assets, eg: src="./main...

      /**
       * Server.
       */
      const server = config.server || (config.server = {});
      server.fs = { allow: ['..'] }; // NB: allows stepping up out of the {CWD} and access other folders in the mono-repo.

      /**
       * Module resolution (monorepo).
       */
      const resolve = config.resolve || (config.resolve = {});
      if (ws) {
        resolve.alias = ws.aliases;
      }

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
          chunkFileNames: 'assets/m.[hash].js', //     |←  m.<hash> == "code/chunk" (module)
          assetFileNames: 'assets/a.[hash].[ext]', //  |←  a.<hash> == "asset"
        },
      };

      /**
       * Run callback for any further modifications to the Vite config.
       * Directly manipulate the {config} parameter object.
       */
      options?.mutate?.({ config, env, ws });
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

  options(args: any[]): t.WorkspacePluginOptions {
    if (args.length === 0) return {};
    if (typeof args[0] === 'function') return { filter: args[0] };
    return args[0] ?? {};
  },

  async workspace(options: t.WorkspacePluginOptions) {
    const { filter } = options;
    if (options.workspace === false) return undefined;
    const denofile = options.workspace === true ? undefined : options.workspace;

    const ws = await ViteConfig.workspace({ denofile, filter });
    if (!ws.exists) {
      const errPath = denofile ?? Path.resolve('.');
      throw new Error(`A workspace could not be found: ${errPath}`);
    }

    return ws;
  },
} as const;
