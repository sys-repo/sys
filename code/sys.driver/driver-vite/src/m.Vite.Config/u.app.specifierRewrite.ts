import { type t, DenoFile, Fs, Is, Json, Path } from './common.ts';

type LoadImports = (configPath: t.StringPath) => Promise<Record<string, string>>;
type DenoInfoModule = {
  specifier?: string;
  local?: string;
};
type DenoInfo = {
  roots?: string[];
  redirects?: Record<string, string>;
  modules?: DenoInfoModule[];
};

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
  const source = input.slice('npm:'.length);
  if (!source) return undefined;

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
}

export function parseDenoInfoRoot(input?: string): string | undefined {
  const parsed = Json.safeParse<DenoInfo>(input);
  if (!parsed.ok) return undefined;
  const root = parsed.data?.roots?.[0];
  return Is.string(root) ? root : undefined;
}

export function parseDenoInfoResolved(input?: string): string | undefined {
  const parsed = Json.safeParse<DenoInfo>(input);
  if (!parsed.ok) return undefined;

  const root = parsed.data?.roots?.[0];
  const redirects = parsed.data?.redirects ?? {};
  const resolved = Is.string(root) ? (redirects[root] ?? root) : undefined;
  if (!Is.string(resolved) || !Array.isArray(parsed.data?.modules)) return resolved;

  const match = parsed.data.modules.find((module) => module.specifier === resolved);
  if (Is.string(match?.local) && match.local.length > 0) return match.local;
  return resolved;
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

        const map = await imports;
        const fromMap = resolveFromImportsMap(specifier, map);
        if (!fromMap) return undefined;
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

} as const;
