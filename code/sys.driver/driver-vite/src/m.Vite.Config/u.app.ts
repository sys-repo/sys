import type { ManualChunksOption } from 'rollup';

import { workspace } from '../m.Vite.Config.Workspace/mod.ts';
import { type t, asArray, Path, R } from './common.ts';
import { commonPlugins } from './u.plugins.ts';

export const app: t.ViteConfigLib['app'] = async (options = {}) => {
  const ws = await wrangle.workspace(options);
  const root = Path.resolve(options.root || Path.cwd());
  const base = options.base || './'; // NB: relative pathing within bundled assets, eg: src="./main..."

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
   * Plugins
   */
  const plugins = await commonPlugins(options.plugins);

  /**
   * Config.
   */
  const format = 'es';
  const build: t.ViteBuildEnvironmentOptions = {
    emptyOutDir: true,
    target: 'esnext',
    minify: options.minify ?? true,
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
    base,
    server: { fs: { allow: ['..'] } }, // NB: allows stepping up out of the {CWD} and access other folders in the monorepo.
    build,
    worker: { format },
    plugins,
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
  async workspace(options: t.WorkspacePluginOptions) {
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
