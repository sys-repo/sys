import { Path, type t } from './common.ts';

/**
 * Configuration plugin.
 */
export const plugin: t.VitePluginFactory = () => {
  return {
    name: 'vite-plugin-sys',
    config(config, _env) {
      const input = wrangle.path('VITE_INPUT');
      const outDir = wrangle.path('VITE_OUTDIR');
      const root = Path.dirname(input);

      config.root = root;
      config.base = './';

      const build = config.build || (config.build = {});
      build.emptyOutDir = true;
      build.outDir = Path.relative(root, outDir);
      build.rollupOptions = {
        input,
        output: {
          entryFileNames: 'assets/-entry.[hash].js',
          chunkFileNames: 'assets/c.[hash].js', //     |←  c.<hash> == "code"
          assetFileNames: 'assets/a.[hash].[ext]', //  |←  a.<hash> == "asset"
        },
      };
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
