import type { ManualChunksOption } from 'rollup';

import { workspace } from '../m.Vite.Config.Workspace/mod.ts';
import { type t, asArray, Path, R } from './common.ts';
import { commonPlugins } from './u.plugins.ts';

export const app: t.ViteConfigLib['app'] = async (options = {}) => {
  const { minify = true } = options;
  const ws = await wrangle.workspace(options);
  const input = options.input ? Path.resolve(options.input) : Path.resolve('./index.html');
  const outDir = options.outDir ? Path.resolve(options.outDir) : Path.resolve('./dist');
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
      input: Path.join(root, 'index.html'),
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
    base: options.base || './', // NB: relative pathing within bundled assets, eg: src="./main...",
    server: { fs: { allow: ['..'] } }, // NB: allows stepping up out of the {CWD} and access other folders in the monorepo.
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
} as const;
