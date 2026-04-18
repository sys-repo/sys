import { type t, DenoFile, Fs, Is, Path } from './common.ts';

type BootstrapResult = {
  readonly path: string;
  readonly cleanup: () => Promise<void>;
};

type BootstrapSource = {
  readonly dir: string;
  readonly imports: Record<string, string>;
  readonly json: Record<string, unknown>;
};

/**
 * Shapes the Deno bootstrap authority for the child Vite CLI.
 * This is intentionally separate from app/plugin resolution.
 */
export const Bootstrap = {
  async create(cwd: string, vite: string): Promise<BootstrapResult | undefined> {
    if (bootstrap.viteMajor(vite) < 8) return undefined;

    const source = await bootstrap.source(cwd);
    const moduleSyncPath = Path.join(source.dir, `.vite.bootstrap.${crypto.randomUUID()}.module-sync-enabled.mjs`);
    await Deno.writeTextFile(moduleSyncPath, 'export default false;\n');
    const imports = bootstrap.sortImports({
      ...source.imports,
      ...(await bootstrap.viteImports(cwd, vite, { moduleSyncPath })),
    });

    const path = Path.join(source.dir, `.vite.bootstrap.${crypto.randomUUID()}.imports.json`);
    await Fs.writeJson(path, { ...source.json, imports });

    return {
      path,
      cleanup: async () => {
        if (await Fs.exists(path)) await Fs.remove(path, { log: false });
        if (await Fs.exists(moduleSyncPath)) await Fs.remove(moduleSyncPath, { log: false });
      },
    };
  },
} as const;

const bootstrap = {
  async source(cwd: string): Promise<BootstrapSource> {
    const deno = await DenoFile.nearest(cwd);
    if (!deno) {
      return { dir: cwd, imports: {}, json: {} };
    }

    const inlineImports = bootstrap.toStringRecord(deno.file.imports);
    const importMapRef = deno.file.importMap;
    if (!Is.str(importMapRef) || importMapRef.trim().length === 0) {
      return { dir: deno.dir, imports: inlineImports, json: {} };
    }

    const path = Path.resolve(deno.dir, importMapRef);
    const current = await Fs.readJson<t.Json>(path);
    const json =
      current.ok && Is.record<Record<string, unknown>>(current.data)
        ? { ...current.data }
        : {};
    const mappedImports = bootstrap.toStringRecord(
      Is.record<Record<string, unknown>>(json.imports) ? json.imports : undefined,
    );
    return {
      dir: Path.dirname(path),
      imports: { ...inlineImports, ...mappedImports },
      json,
    };
  },

  async viteImports(
    cwd: string,
    vite: string,
    paths: { moduleSyncPath: string },
  ) {
    const imports: Record<string, string> = {
      '#module-sync-enabled': Path.toFileUrl(paths.moduleSyncPath).href,
      fs: 'node:fs',
      path: 'node:path',
      zlib: 'node:zlib',
      vite,
      'vite/internal': `${vite}/internal`,
      'vite/module-runner': `${vite}/module-runner`,
    };

    for (const [name, version] of Object.entries(VITE_BOOTSTRAP_DEPENDENCIES)) {
      imports[name] = `npm:${name}@${version}`;
    }
    for (const subpath of ROLLDOWN_BOOTSTRAP_SUBPATHS) {
      imports[`rolldown/${subpath}`] = `npm:rolldown@${VITE_BOOTSTRAP_DEPENDENCIES.rolldown}/${subpath}`;
    }

    const reactPlugin = await bootstrap.consumerVersion(cwd, '@vitejs/plugin-react');
    if (reactPlugin) {
      for (const [name, version] of Object.entries(PLUGIN_REACT_BOOTSTRAP_DEPENDENCIES)) {
        imports[name] = `npm:${name}@${version}`;
      }
    }

    return imports;
  },

  async consumerVersion(cwd: string, name: string) {
    const pkgPath = bootstrap.packageAnchor(cwd);
    const pkg = (await Fs.readJson<{
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    }>(pkgPath)).data ?? {};
    return pkg.dependencies?.[name] ?? pkg.devDependencies?.[name] ?? '';
  },

  packageAnchor(start: string) {
    let current = Path.resolve(start);

    while (true) {
      const path = Path.join(current, 'package.json');
      try {
        const stat = Deno.statSync(path);
        if (stat.isFile) return path;
      } catch {
        // Keep climbing until we find the consumer package boundary.
      }

      const parent = Path.dirname(current);
      if (parent === current) return Path.join(Path.resolve(start), 'package.json');
      current = parent;
    }
  },

  sortImports(imports: Record<string, string>) {
    return Object.fromEntries(Object.entries(imports).sort(([a], [b]) => a.localeCompare(b)));
  },

  toStringRecord(value: unknown) {
    if (!Is.record<Record<string, unknown>>(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([, entry]) => Is.str(entry))) as Record<string, string>;
  },

  viteMajor(specifier: string) {
    const match = specifier.match(/^npm:vite@(\d+)/);
    return match ? Number(match[1]) : 0;
  },
} as const;

const VITE_BOOTSTRAP_DEPENDENCIES = {
  lightningcss: '^1.32.0',
  picomatch: '^4.0.3',
  postcss: '^8.5.8',
  rolldown: '1.0.0-rc.11',
  tinyglobby: '^0.2.15',
} as const;

const PLUGIN_REACT_BOOTSTRAP_DEPENDENCIES = {
  '@rolldown/pluginutils': '1.0.0-rc.7',
} as const;

const ROLLDOWN_BOOTSTRAP_SUBPATHS = ['experimental', 'filter', 'parseAst', 'plugins', 'utils'] as const;
