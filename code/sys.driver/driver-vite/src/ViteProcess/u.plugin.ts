import { Path, type t } from './common.ts';

/**
 * Configuration plugin.
 */
export const plugin: t.VitePluginFactory = (modify) => {
  return {
    name: 'vite-plugin-sys',
    config(config, env) {
      const input = wrangle.path('VITE_INPUT');
      const outDir = wrangle.path('VITE_OUTDIR');
      const root = Path.dirname(input);

      /**
       * Base
       */
      config.root = root;
      config.base = './';

      /**
       * Server
       */
      const server = config.server || (config.server = {});
      server.fs = { allow: ['..'] };

      /**
       * Module resolution (monorepo).
       */
      const resolve = config.resolve || (config.resolve = {});
      resolve.alias = {
        '@sys/tmp/ui': Path.resolve('../../sys.tmp/src/ui/mod.ts'),
      };
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
       * Run callback for any further modifications
       */
      modify?.({ config, env });
    },
  };
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
