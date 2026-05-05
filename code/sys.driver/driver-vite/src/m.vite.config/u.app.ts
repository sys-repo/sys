import { createRequire } from 'node:module';
import { Perf } from '../common/u.perf.ts';
import { workspace } from '../m.vite.config.workspace/mod.ts';
import { OptimizeImportsPlugin } from '../m.vite.plugins/m.OptimizeImports/mod.ts';
import { deriveWorkspacePackageRules } from '../m.vite.plugins/m.OptimizeImports/u.derive.ts';
import { oxcPreflightPlugin } from './u.oxcPreflight.ts';
import { asArray, Delete, DenoFile, Fs, Is, Path, type t } from './common.ts';
import { createNpmPrewarm, createSpecifierRewrite } from './u.app.specifierRewrite.ts';
import { paths as formatPaths } from './u.paths.ts';
import { commonPlugins } from './u.plugins.ts';

/**
 * Application bundle configuration.
 */
export const app: t.ViteConfigLib['app'] = async (options = {}) => {
  const { minify = true } = options;
  const end = Perf.section('config.app', { entry: options.paths?.app.entry ?? '', minify }, {
    level: 2,
  });
  const paths = formatPaths(options.paths);
  const ws = await wrangle.workspace(options);
  const denoConfig = await Perf.measure(
    'config.app.denoConfig',
    async () => await wrangle.denoConfig(paths.cwd, ws),
    {
      cwd: paths.cwd,
    },
    { level: 2 },
  );
  const npmPrewarm = denoConfig
    ? await Perf.measure(
      'config.app.canPrewarmNpm',
      async () => await wrangle.canPrewarmNpm(denoConfig),
      { config: denoConfig },
      { level: 2 },
    )
    : false;
  const optimizeImports = options.plugins?.optimizeImports ?? true;
  const optimizePackages = optimizeImports && ws
    ? await Perf.measure(
      'config.app.optimizePackages',
      async () => await deriveWorkspacePackageRules(ws),
      {
        aliases: ws.aliases.length,
      },
      { level: 2 },
    )
    : [];
  const resolveAliases = await Perf.measure(
    'config.app.resolveAliases',
    async () => await wrangle.resolveAliases(paths.cwd, denoConfig, ws),
    {
      cwd: paths.cwd,
      workspaceAliases: ws?.aliases.length ?? 0,
      workspaceChildren: ws?.children.length ?? 0,
    },
    { level: 2 },
  );

  const main = Path.join(paths.cwd, paths.app.entry);
  const sw = paths.app.sw ? Path.join(paths.cwd, paths.app.sw) : undefined;
  const outDir = Path.join(paths.cwd, paths.app.outDir);
  const publicDir = Path.join(paths.cwd, 'public');
  const root = Path.dirname(main);
  const cacheDir = wrangle.cacheDir(paths.cwd);

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
  const plugins = await Perf.measure(
    'config.app.commonPlugins',
    async () => await commonPlugins(options.plugins),
    {
      react: options.plugins?.react ?? true,
    },
    { level: 2 },
  );
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
  plugins.push(oxcPreflightPlugin());
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
    cacheDir,
    base: paths.app.base,
    oxc: options.oxc,
    optimizeDeps: options.optimizeDeps,
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
      alias: resolveAliases,
    },
  };

  /**
   * Finish up.
   */
  Perf.log('config.app.summary', {
    root,
    cacheDir,
    aliases: resolveAliases.length,
    optimizePackages: optimizePackages.length,
    npmPrewarm,
    plugins: plugins.length,
    vitePlugins: options.vitePlugins?.length ?? 0,
  }, { level: 1 });
  end({
    root,
    cacheDir,
    aliases: resolveAliases.length,
    optimizePackages: optimizePackages.length,
    npmPrewarm,
    plugins: plugins.length,
  });
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

  cacheDir(cwd: string) {
    return Path.join(Path.resolve(cwd), 'node_modules', '.vite');
  },

  async resolveAliases(
    cwd: string,
    denoConfig: string | undefined,
    ws?: t.ViteDenoWorkspace,
  ) {
    const workspaceAliases = ws?.aliases ?? [];
    const singletonAliases = denoConfig
      ? await wrangle.singletonPackageAliases(cwd, Path.dirname(denoConfig), ws)
      : [];
    return [...workspaceAliases, ...singletonAliases];
  },

  async singletonPackageAliases(cwd: string, authorityDir: string, ws?: t.ViteDenoWorkspace) {
    const dirs = wrangle.singletonPackageConsumerDirs(cwd, ws);
    const aliases: t.ViteAlias[] = [];

    for (const dir of dirs) {
      if (Path.resolve(dir) === Path.resolve(authorityDir)) continue;
      const packages = await wrangle.topLevelPackages(dir);
      const next = await Promise.all(
        packages.map(async (pkg) => await wrangle.singletonPackageAlias(dir, authorityDir, pkg)),
      );
      aliases.push(...next.filter(Boolean) as t.ViteAlias[]);
    }

    return wrangle.uniqueAliases(aliases);
  },

  async singletonPackageAlias(cwd: string, authorityDir: string, pkg: string) {
    const consumerPackageDir = await wrangle.topLevelPackageDir(cwd, pkg);
    if (!consumerPackageDir) return undefined;
    if (!await wrangle.isReactLinkedPackage(consumerPackageDir)) return undefined;

    const authorityPackageDir = await wrangle.packageDir(authorityDir, pkg);
    if (!authorityPackageDir) return undefined;

    const authorityVersion = await wrangle.packageVersion(authorityPackageDir);
    const consumerVersion = await wrangle.packageVersion(consumerPackageDir);
    if (!authorityVersion || !consumerVersion || authorityVersion !== consumerVersion) {
      return undefined;
    }
    if (Path.resolve(authorityPackageDir) === Path.resolve(consumerPackageDir)) return undefined;

    return { find: pkg, replacement: authorityPackageDir } as const;
  },

  async packageDir(start: string, pkg: string) {
    const anchor = await wrangle.packageAnchor(start);
    const require = createRequire(anchor);
    try {
      const path = require.resolve(`${pkg}/package.json`);
      return Path.dirname(path);
    } catch {
      return '';
    }
  },

  singletonPackageConsumerDirs(cwd: string, ws?: t.ViteDenoWorkspace) {
    const dirs = new Set([Path.resolve(cwd)]);
    if (!ws) return [...dirs];

    const base = Path.dirname(ws.file);
    for (const child of ws.children) {
      dirs.add(Path.join(base, child.path.dir));
    }
    return [...dirs].map((dir) => Path.resolve(dir)).sort();
  },

  uniqueAliases(list: t.ViteAlias[]) {
    const map = new Map<string, t.ViteAlias>();
    for (const alias of list) {
      if (!map.has(String(alias.find))) map.set(String(alias.find), alias);
    }
    return [...map.values()];
  },

  async topLevelPackages(cwd: string) {
    const root = Path.join(Path.resolve(cwd), 'node_modules');
    if (!(await Fs.exists(root))) return [];

    const packages: string[] = [];
    for await (const item of Deno.readDir(root)) {
      if (!item.isDirectory && !item.isSymlink) continue;
      if (item.name.startsWith('.')) continue;
      if (!item.name.startsWith('@')) {
        packages.push(item.name);
        continue;
      }
      const scopeDir = Path.join(root, item.name);
      for await (const child of Deno.readDir(scopeDir)) {
        if (!child.isDirectory && !child.isSymlink) continue;
        packages.push(`${item.name}/${child.name}`);
      }
    }
    return packages.sort();
  },

  async topLevelPackageDir(cwd: string, pkg: string) {
    const path = Path.join(Path.resolve(cwd), 'node_modules', pkg, 'package.json');
    return await Fs.exists(path) ? Path.dirname(path) : '';
  },

  async isReactLinkedPackage(dir: string) {
    const pkg = (await Fs.readJson<{
      dependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    }>(Path.join(dir, 'package.json'))).data;
    return [
      pkg?.dependencies?.react,
      pkg?.dependencies?.['react-dom'],
      pkg?.peerDependencies?.react,
      pkg?.peerDependencies?.['react-dom'],
    ].some(Boolean);
  },

  async packageVersion(dir: string) {
    const pkg = (await Fs.readJson<{ version?: string }>(Path.join(dir, 'package.json'))).data;
    return pkg?.version ?? '';
  },

  async packageAnchor(start: string) {
    let current = Path.resolve(start);
    while (true) {
      const path = Path.join(current, 'package.json');
      if (await Fs.exists(path)) return path;
      const parent = Path.dirname(current);
      if (parent === current) return Path.join(Path.resolve(start), 'package.json');
      current = parent;
    }
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
