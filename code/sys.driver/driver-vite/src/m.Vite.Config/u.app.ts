import type { ManualChunksOption } from 'rollup';

import { workspace } from '../m.Vite.Config.Workspace/mod.ts';
import { type t, asArray, Path, R } from './common.ts';
import { paths as formatPaths } from './u.path.ts';
import { commonPlugins } from './u.plugins.ts';

/**
 * Application bundle configuration.
 */
export const app: t.ViteConfigLib['app'] = async (options = {}) => {
  const { minify = true } = options;
  const ws = await wrangle.workspace(options);
  const paths = formatPaths(options.paths);

  const input = Path.join(paths.cwd, paths.app.entry);
  const outDir = Path.join(paths.cwd, paths.app.outDir);
  const root = Path.dirname(input);

  /**
   * Chunking.
   */
  const manualChunks: ManualChunksOption = {};
  if (options.chunks) {
    const chunker: t.ViteModuleChunksArgs = {
      chunk(alias, moduleName) {
        manualChunks[alias] = R.uniq(asArray(moduleName ?? alias));
        return chunker;
      },
    };
    options.chunks(chunker);
  }

  /**
   * Config.
   */
  const format = 'es';
  const plugins = await commonPlugins(options.plugins);
  const build: t.ViteBuildEnvironmentOptions = {
    target: 'esnext',
    minify,
    emptyOutDir: true,
    outDir,
    rollupOptions: {
      input,
      output: {
        format,
        manualChunks,
        entryFileNames: 'pkg/-entry.[hash].js',
        chunkFileNames: 'pkg/m.[hash].js', //     |←  m.<hash> == "code/chunk" (module)
        assetFileNames: 'pkg/a.[hash].[ext]', //  |←  a.<hash> == "asset"
      },
    },
  };

  const res: t.ViteUserConfig = {
    root,
    base: paths.app.base,
    server: { fs: { allow: ['..'] } }, // NB: allows stepping up out of the {cwd} and access other folders in the monorepo.
    worker: { format },
    get build() {
      return build;
    },
    get plugins() {
      return plugins;
    },
    resolve: {
      get alias() {
        return ws ? ws.aliases : undefined;
      },
    },
  };

  /**
   * Finish up.
   */
  return res;
};

/**
 * Helpers
 */
const wrangle = {
  async workspace(options: t.ViteConfigAppOptions) {
    const { filter } = options;
    if (options.workspace === false) return undefined;

    const denofile = options.workspace === true ? undefined : options.workspace;
    const ws = await workspace({ denofile, filter });
    if (!ws.exists) {
      const errPath = denofile ?? Path.resolve('.');
      throw new Error(`A workspace could not be found: ${errPath}`);
    }

    return ws;
  },

  //   paths() {},
  //
  //   envPath(envKey: string) {
  //     const path = Deno.env.get(envKey) ?? '';
  //     if (!path) throw new Error(`Path at env-key "${envKey}" not found`);
  //     return Path.resolve(path);
  //   },
} as const;
