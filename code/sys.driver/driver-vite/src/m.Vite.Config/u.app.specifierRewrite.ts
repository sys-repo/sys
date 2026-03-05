import { type t, DenoFile, Fs, Is, Json, Path } from './common.ts';

type LoadImports = (configPath: t.StringPath) => Promise<Record<string, string>>;

export function createSpecifierRewrite(
  configPath: t.StringPath,
  options: { loadImports?: LoadImports } = {},
): t.VitePlugin {
  const rewriteSpecifier = wrangle.rewriteSpecifier(configPath, options.loadImports);

  return {
    name: 'sys:specifier-rewrite',
    enforce: 'pre',
    async resolveId(source) {
      const rewritten = await rewriteSpecifier(source);
      if (!rewritten || rewritten === source) return null;
      return rewritten;
    },
  };
}

export function parseNpmSpecifier(input: string): string | undefined {
  const source = wrangle.stripPrefix(input, 'npm:');
  if (!source) return undefined;
  return wrangle.parseRegistrySpecifier(source);
}

export function parseJsrSpecifier(input: string): string | undefined {
  const source = wrangle.stripPrefix(input, 'jsr:');
  if (!source) return undefined;
  return wrangle.parseRegistrySpecifier(source);
}

export function resolveFromImportsMap(
  specifier: string,
  imports: Record<string, string>,
): string | undefined {
  const match = wrangle.longestImportMatch(specifier, imports);
  if (!match) return undefined;
  return `${match.target}${match.suffix}`;
}

const wrangle = {
  rewriteSpecifier(
    configPath: t.StringPath,
    loadImports?: LoadImports,
  ): (specifier: string) => Promise<string | undefined> {
    const imports = (loadImports ?? wrangle.loadImports)(configPath);
    const cache = new Map<string, Promise<string | undefined>>();

    return async (specifier) => {
      const cached = cache.get(specifier);
      if (cached) return await cached;

      const promise = (async () => {
        if (specifier.startsWith('npm:')) return parseNpmSpecifier(specifier);
        if (specifier.startsWith('jsr:')) return undefined;

        const map = await imports;
        const fromMap = resolveFromImportsMap(specifier, map);
        if (!fromMap) return undefined;
        if (fromMap.startsWith('npm:')) return parseNpmSpecifier(fromMap);
        if (fromMap.startsWith('jsr:')) return undefined;
        return fromMap;
      })();
      cache.set(specifier, promise);
      return await promise;
    };
  },

  async loadImports(configPath: t.StringPath): Promise<Record<string, string>> {
    const file = await DenoFile.load(configPath);
    if (!file.ok || !file.data) return {};

    const denoImports = wrangle.toStringRecord(file.data.imports);
    const importMapPath = file.data.importMap ? wrangle.resolveImportMapPath(file.path, file.data.importMap) : undefined;
    if (!importMapPath) return denoImports;

    const importMap = await Fs.readJson<t.DenoImportMapJson>(importMapPath);
    if (!importMap.ok || !importMap.data) return denoImports;

    const mapImports = wrangle.toStringRecord(importMap.data.imports);
    return { ...mapImports, ...denoImports };
  },

  resolveImportMapPath(configPath: t.StringPath, importMapPath: t.StringPath) {
    const dir = Path.dirname(configPath);
    return Path.resolve(dir, importMapPath);
  },

  toStringRecord(input: unknown): Record<string, string> {
    const res: Record<string, string> = {};
    if (!input || typeof input !== 'object') return res;
    for (const [key, value] of Object.entries(input)) {
      if (!Is.string(value)) continue;
      res[key] = value;
    }
    return res;
  },

  longestImportMatch(specifier: string, imports: Record<string, string>) {
    let best: { target: string; suffix: string; len: number } | undefined;
    for (const [key, target] of Object.entries(imports)) {
      if (!Is.string(target)) continue;
      if (!(specifier === key || specifier.startsWith(`${key}/`))) continue;
      const candidate = { target, suffix: specifier.slice(key.length), len: key.length };
      if (!best || candidate.len > best.len) best = candidate;
    }
    return best;
  },

  stripPrefix(input: string, prefix: string) {
    return input.startsWith(prefix) ? input.slice(prefix.length) : '';
  },

  parseRegistrySpecifier(source: string): string | undefined {
    const scoped = source.startsWith('@');
    let nameWithVersion = source;
    let subpath = '';

    if (scoped) {
      const first = source.indexOf('/');
      const second = first >= 0 ? source.indexOf('/', first + 1) : -1;
      if (second >= 0) {
        nameWithVersion = source.slice(0, second);
        subpath = source.slice(second);
      }
    } else {
      const slash = source.indexOf('/');
      if (slash >= 0) {
        nameWithVersion = source.slice(0, slash);
        subpath = source.slice(slash);
      }
    }

    const at = nameWithVersion.lastIndexOf('@');
    const pkg = at > 0 ? nameWithVersion.slice(0, at) : nameWithVersion;
    if (!pkg) return undefined;
    return `${pkg}${subpath}`;
  },
} as const;
