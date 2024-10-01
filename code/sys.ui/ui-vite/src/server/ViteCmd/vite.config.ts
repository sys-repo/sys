import { defineConfig } from 'npm:vite';
import reactPlugin from 'npm:vite-plugin-react-swc';
import { Path, type t } from './common.ts';

export default defineConfig((_ctx) => {
  const input = wrangle.path('VITE_INPUT');
  const outDir = wrangle.path('VITE_OUTDIR');
  const root = Path.dirname(input);

  /**
   * Base configuration.
   */
  const res: t.ViteUserConfig = {
    root,
    base: './',
    plugins: [reactPlugin()],
    build: {
      emptyOutDir: true,
      outDir: Path.relative(root, outDir),
      rollupOptions: {
        input,
        output: {
          entryFileNames: 'assets/-entry.[hash].js',
          chunkFileNames: 'assets/c.[hash].js', //     |←  c.<filename> == "code"
          assetFileNames: 'assets/a.[hash].[ext]', //  |←  a.<filename> == "asset"
        },
      },
    },
  };

  /**
   * Finish up.
   */
  return res;
});

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
