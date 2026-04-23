import { Perf } from '../common/u.perf.ts';
import { DenoFile, Fs, Is, Path, type t } from './common.ts';

type BootstrapSource = {
  readonly dir: string;
  readonly imports: Record<string, string>;
  readonly scopes?: Record<string, Record<string, string>>;
};

export async function createProjection(
  args: t.ViteStartup.Projection.Args,
): Promise<t.ViteStartup.Authority> {
  const end = Perf.section('startup.projection', { cwd: args.cwd, vite: args.vite });
  const source = await projection.source(args.cwd);
  const imports = projection.sortImports({
    ...source.imports,
    ...(await projection.viteImports(args.cwd, args.vite)),
  });

  const authority = {
    dir: source.dir as t.StringAbsoluteDir,
    imports,
    ...(source.scopes ? { scopes: source.scopes } : {}),
  };
  end({ dir: authority.dir, imports: Object.keys(authority.imports).length, scopes: Object.keys(authority.scopes ?? {}).length });
  return authority;
}

const projection = {
  async source(cwd: string): Promise<BootstrapSource> {
    const deno = await DenoFile.nearest(cwd);
    const workspaceRoot = await DenoFile.Path.nearest(cwd, (e) => Array.isArray(e.file.workspace));
    const nearest = deno ? await projection.sourceFromDenoFile(deno.dir, deno.file) : undefined;
    const root = workspaceRoot ? await projection.sourceFromPath(workspaceRoot) : undefined;
    return projection.rankedSource({ cwd, nearest, root });
  },

  rankedSource(
    args: { cwd: string; nearest?: BootstrapSource; root?: BootstrapSource },
  ): BootstrapSource {
    const primary = args.nearest ?? args.root;
    if (!primary) return { dir: args.cwd, imports: {} };

    const inheritedRootImports = args.nearest && args.root
      ? projection.rootStartupImports(args.root.imports)
      : {};

    return {
      dir: primary.dir,
      imports: { ...inheritedRootImports, ...primary.imports },
      ...(primary.scopes ? { scopes: { ...primary.scopes } } : {}),
    };
  },

  rootStartupImports(imports: Record<string, string>) {
    return Object.fromEntries(
      Object.entries(imports).filter(([, value]) => projection.isStartupExternal(value)),
    );
  },

  isStartupExternal(value: string) {
    return value.startsWith('npm:') ||
      value.startsWith('jsr:') ||
      value.startsWith('node:') ||
      value.startsWith('http:') ||
      value.startsWith('https:') ||
      value.startsWith('data:');
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
      return { dir, imports: inlineImports };
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
    const scopes = projection.toScopeRecord(json.scopes);

    return {
      dir: Path.dirname(path),
      imports: { ...inlineImports, ...mappedImports },
      ...(Object.keys(scopes).length > 0 ? { scopes } : {}),
    };
  },

  async viteImports(_cwd: string, vite: string) {
    return {
      zlib: 'node:zlib',
      vite,
      'vite/internal': `${vite}/internal`,
      'vite/module-runner': `${vite}/module-runner`,
    } satisfies Record<string, string>;
  },

  sortImports(imports: Record<string, string>) {
    return Object.fromEntries(Object.entries(imports).sort(([a], [b]) => a.localeCompare(b)));
  },

  toStringRecord(value: unknown) {
    if (!Is.record<Record<string, unknown>>(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([, entry]) => Is.str(entry))) as Record<string, string>;
  },

  toScopeRecord(value: unknown) {
    if (!Is.record<Record<string, unknown>>(value)) return {};
    return Object.fromEntries(
      Object.entries(value)
        .map(([scope, imports]) => [scope, projection.toStringRecord(imports)])
        .filter(([, imports]) => Object.keys(imports).length > 0),
    ) as Record<string, Record<string, string>>;
  },
} as const;

