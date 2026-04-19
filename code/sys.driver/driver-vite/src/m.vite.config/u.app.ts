import { workspace } from '../m.vite.config.workspace/mod.ts';
import { OptimizeImportsPlugin } from '../m.vite.plugins/m.OptimizeImports/mod.ts';
import { deriveWorkspacePackageRules } from '../m.vite.plugins/m.OptimizeImports/u.derive.ts';
import { asArray, Delete, DenoFile, Fs, Is, Path, type t } from './common.ts';
import { createNpmPrewarm, createSpecifierRewrite } from './u.app.specifierRewrite.ts';
import { paths as formatPaths } from './u.paths.ts';
import { commonPlugins } from './u.plugins.ts';

/**
 * Application bundle configuration.
 */
export const app: t.ViteConfigLib['app'] = async (options = {}) => {
  const { minify = true } = options;
  const paths = formatPaths(options.paths);
  const ws = await wrangle.workspace(options);
  const denoConfig = await wrangle.denoConfig(paths.cwd, ws);
  const npmPrewarm = denoConfig ? await wrangle.canPrewarmNpm(denoConfig) : false;
  const optimizeImports = options.plugins?.optimizeImports ?? true;
  const optimizePackages = optimizeImports && ws ? await deriveWorkspacePackageRules(ws) : [];

  const main = Path.join(paths.cwd, paths.app.entry);
  const sw = paths.app.sw ? Path.join(paths.cwd, paths.app.sw) : undefined;
  const outDir = Path.join(paths.cwd, paths.app.outDir);
  const publicDir = Path.join(paths.cwd, 'public');
  const root = Path.dirname(main);

  /**
   * Chunking:
   */
  const manualChunks: Record<string, string[]> = {};
  if (options.chunks) {
    const chunker: t.ViteModuleChunksArgs = {
      chunk(alias, moduleName) {
        manualChunks[alias] = [...new Set(asArray(moduleName ?? alias))];
        return chunker;
      },
    };
    options.chunks(chunker);
  }

  const format = 'es';
  const output: t.Rollup.OutputOptions = {
    format,
    manualChunks: wrangle.manualChunks(manualChunks),
    chunkFileNames: 'pkg/m.[hash].js', //     |←  m.<hash> == "code/chunk" (module)
    assetFileNames: 'pkg/a.[hash].[ext]', //  |←  a.<hash> == "asset"
    entryFileNames(chunkInfo) {
      if (chunkInfo.name === 'sw') return 'sw.js';
      return 'pkg/-entry.[hash].js';
    },
  };

  /**
   * Plugins:
   */
  const plugins = await commonPlugins(options.plugins);
  if (denoConfig && (options.plugins?.deno ?? true)) {
    plugins.unshift(createSpecifierRewrite(denoConfig));
    if (npmPrewarm) plugins.unshift(createNpmPrewarm(denoConfig));
  }
  if (optimizeImports) {
    plugins.push(OptimizeImportsPlugin.plugin({ packages: optimizePackages }));
  }
  if (options.vitePlugins?.length) {
    plugins.push(...options.vitePlugins);
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

  async denoConfig(cwd: string, ws?: { file: t.StringPath }) {
    if (ws?.file) return ws.file;

    const local = Path.join(cwd, 'deno.json');
    return (await Fs.exists(local)) ? local : undefined;
  },

  async canPrewarmNpm(configPath: string) {
    const file = await DenoFile.load(configPath);
    const nodeModulesDir = (file.data as { nodeModulesDir?: unknown } | undefined)?.nodeModulesDir;
    return nodeModulesDir === 'auto';
  },

  path(envKey: string) {
    const path = Deno.env.get(envKey) ?? '';
    return path ? Path.resolve(path) : '';
  },

  manualChunks(chunks: Record<string, string[]>) {
    const entries = Object.entries(chunks);
    if (entries.length === 0) return undefined;

    return ((id: string) => {
      const resolved = wrangle.normalizeModuleId(id);
      for (const [alias, modules] of entries) {
        if (modules.some((moduleName) => wrangle.matchesManualChunk(resolved, moduleName))) {
          return alias;
        }
      }
      return undefined;
    }) as t.Rollup.OutputOptions['manualChunks'];
  },

  matchesManualChunk(id: string, moduleName: string) {
    const target = wrangle.normalizeModuleId(moduleName);
    return id === target || id.includes(`/node_modules/${target}/`);
  },

  normalizeModuleId(value: string) {
    return value.replaceAll('\\', '/');
  },
} as const;
