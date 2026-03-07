import type { ManualChunksOption, PreRenderedChunk } from 'rollup';

import { workspace } from '../m.vite.config.workspace/mod.ts';
import { type t, Is, asArray, Delete, Path, R } from './common.ts';
import { createSpecifierRewrite } from './u.app.specifierRewrite.ts';
import { paths as formatPaths } from './u.paths.ts';
import { commonPlugins } from './u.plugins.ts';

/**
 * Application bundle configuration.
 */
export const app: t.ViteConfigLib['app'] = async (options = {}) => {
  const { minify = true } = options;
  const ws = await wrangle.workspace(options);
  const paths = formatPaths(options.paths);

  const main = Path.join(paths.cwd, paths.app.entry);
  const sw = paths.app.sw ? Path.join(paths.cwd, paths.app.sw) : undefined;
  const outDir = Path.join(paths.cwd, paths.app.outDir);
  const publicDir = Path.join(paths.cwd, 'public');
  const root = Path.dirname(main);

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

  const format = 'es';
  const output: t.Rollup.OutputOptions = {
    format,
    manualChunks,
    chunkFileNames: 'pkg/m.[hash].js', //     |←  m.<hash> == "code/chunk" (module)
    assetFileNames: 'pkg/a.[hash].[ext]', //  |←  a.<hash> == "asset"
    entryFileNames(chunkInfo: PreRenderedChunk) {
      if (chunkInfo.name === 'sw') return 'sw.js';
      return 'pkg/-entry.[hash].js';
    },
  };

  /**
   * Plugins
   */
  const plugins = await commonPlugins(options.plugins);
  if (ws && (options.plugins?.deno ?? true)) {
    plugins.unshift(createSpecifierRewrite(ws.file));
  }
  if (Boolean(options.visualizer)) {
    // NB: the visualizer must be added last.
    const filename = Is.string(options.visualizer) ? options.visualizer : 'dist/stats.html';
    const { visualizer } = await import('rollup-plugin-visualizer');
    plugins.push(visualizer({ filename }));
  }

  /**
   * Config:
   */
  const build: t.ViteBuildEnvironmentOptions = {
    target: 'esnext',
    minify,
    emptyOutDir: true,
    outDir,
    rollupOptions: {
      input: Delete.undefined<{}>({ main, sw }),
      output,
    },
  };

  const res: t.ViteUserConfig = {
    root,
    envDir: paths.cwd,
    publicDir,
    base: paths.app.base,
    server: { fs: { allow: ['..'] } }, // NB: allows stepping up out of the {cwd} and access other folders in the monorepo.
    worker: {
      format,
      plugins: () => plugins,
      rollupOptions: { output },
    },
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

  path(envKey: string) {
    const path = Deno.env.get(envKey) ?? '';
    return path ? Path.resolve(path) : '';
  },
} as const;
