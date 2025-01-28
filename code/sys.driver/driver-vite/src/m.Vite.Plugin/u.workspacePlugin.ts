import type { ManualChunksOption } from 'rollup';
import { R, asArray, Path, ViteConfig, type t } from './common.ts';

/**
 * Configure a deno workspace to addressable (via import) within Vite.
 */
export const workspacePlugin: t.VitePluginLib['workspace'] = async (...args: any[]) => {
  const options = wrangle.options(args);
  const { pkg } = options;
  const ws = await wrangle.workspace(options);

  /**
   * Plugin.
   */
  const plugin: t.WorkspacePlugin = {
    name: 'vite-plugin-workspace',
    info: { ws, pkg },
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
      const manualChunks: ManualChunksOption = {};
      const build = config.build || (config.build = {});
      build.emptyOutDir = true;
      build.outDir = Path.relative(root, outDir);
      build.target = 'esnext';
      build.minify = options.minify ?? true;
      build.rollupOptions = {
        input,
        output: {
          manualChunks,
          format: 'es',
          entryFileNames: 'pkg/-entry.[hash].js',
          chunkFileNames: 'pkg/m.[hash].js', //     |←  m.<hash> == "code/chunk" (module)
          assetFileNames: 'pkg/a.[hash].[ext]', //  |←  a.<hash> == "asset"
        },
      };

      /**
       * Worker
       */
      const worker = config.worker || (config.worker = {});
      worker.format = 'es';

      /**
       * Chunking.
       */
      const chunker: t.ViteModuleChunksArgs = {
        chunk(alias, moduleName) {
          manualChunks[alias] = R.uniq(asArray(moduleName ?? alias));
          return chunker;
        },
      };
      options.chunks?.(chunker);

      /**
       * Run callback for any further modifications to the [vite.config].
       * Directly manipulate the {config} parameter object.
       */
      options.mutate?.({ config, env, ws });

      // Finish up.
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
