import { DenoFile, Fs, Is, Path, type t } from './common.ts';
import { AUTHORITY_JSON, type AuthorityState } from './u.internal.ts';

type BootstrapSource = {
  readonly dir: string;
  readonly imports: Record<string, string>;
  readonly json: Record<string, unknown>;
};

export async function createProjection(
  args: t.ViteStartup.Projection.Args,
): Promise<t.ViteStartup.Authority> {
  const source = await projection.source(args.cwd);
  const imports = projection.sortImports({
    ...source.imports,
    ...(await projection.viteImports(args.cwd, args.vite)),
  });

  const state: AuthorityState = {
    dir: source.dir as t.StringAbsoluteDir,
    imports,
    [AUTHORITY_JSON]: source.json,
  };

  return state;
}

const projection = {
  async source(cwd: string): Promise<BootstrapSource> {
    const deno = await DenoFile.nearest(cwd);
    const workspaceRoot = await DenoFile.Path.nearest(cwd, (e) => Array.isArray(e.file.workspace));
    const nearest = deno ? await projection.sourceFromDenoFile(deno.dir, deno.file) : undefined;
    const root = workspaceRoot ? await projection.sourceFromPath(workspaceRoot) : undefined;

    const baseDir = nearest?.dir ?? root?.dir ?? cwd;
    return {
      dir: baseDir,
      imports: {
        ...(root?.imports ?? {}),
        ...(nearest?.imports ?? {}),
      },
      json: {
        ...(root?.json ?? {}),
        ...(nearest?.json ?? {}),
      },
    };
  },

  async sourceFromPath(path: string) {
    const loaded = await Fs.readJson<t.DenoFileJson>(path);
    return loaded.ok && loaded.data
      ? await projection.sourceFromDenoFile(Path.dirname(path), loaded.data)
      : undefined;
  },

  async sourceFromDenoFile(dir: string, file: t.DenoFileJson): Promise<BootstrapSource> {
    const inlineImports = projection.toStringRecord(file.imports);
    const importMapRef = file.importMap;
    if (!Is.str(importMapRef) || importMapRef.trim().length === 0) {
      return { dir, imports: inlineImports, json: {} };
    }

    const path = Path.resolve(dir, importMapRef);
    const current = await Fs.readJson<t.Json>(path);
    const json =
      current.ok && Is.record<Record<string, unknown>>(current.data)
        ? { ...current.data }
        : {};
    const mappedImports = projection.toStringRecord(
      Is.record<Record<string, unknown>>(json.imports) ? json.imports : undefined,
    );

    return {
      dir: Path.dirname(path),
      imports: { ...inlineImports, ...mappedImports },
      json,
    };
  },

  async viteImports(cwd: string, vite: string) {
    const imports: Record<string, string> = {
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

    const reactPlugin = await projection.consumerVersion(cwd, '@vitejs/plugin-react');
    if (reactPlugin) {
      for (const [name, version] of Object.entries(PLUGIN_REACT_BOOTSTRAP_DEPENDENCIES)) {
        imports[name] = `npm:${name}@${version}`;
      }
    }

    return imports;
  },

  async consumerVersion(cwd: string, name: string) {
    const pkgPath = await projection.packageAnchor(cwd);
    const pkg = (await Fs.readJson<{
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    }>(pkgPath)).data ?? {};
    return pkg.dependencies?.[name] ?? pkg.devDependencies?.[name] ?? '';
  },

  async packageAnchor(start: string) {
    let current = Path.resolve(start);

    while (true) {
      const path = Path.join(current, 'package.json');
      const stat = await Fs.stat(path);
      if (stat?.isFile) return path;

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
