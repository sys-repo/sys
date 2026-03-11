import { type t, DenoFile, Fs, Is, Json, Path } from './common.ts';

type LoadImports = (configPath: t.StringPath) => Promise<Record<string, string>>;
type WarmNpm = (specifier: string, cwd: string) => Promise<void>;

export function createSpecifierRewrite(
  configPath: t.StringPath,
  options: { loadImports?: LoadImports } = {},
): t.VitePlugin {
  const rewriteSpecifier = wrangle.rewriteSpecifier(configPath, options.loadImports);

  return {
    name: 'sys:specifier-rewrite',
    enforce: 'pre',
    async resolveId(
      this: { resolve?: (id: string, importer?: string, options?: { skipSelf?: boolean }) => Promise<{ id: string } | null> } | undefined,
      source: string,
      importer?: string,
    ) {
      const rewritten = await rewriteSpecifier(source);
      if (!rewritten) return null;

      const resolved = this?.resolve
        ? await this.resolve(rewritten, importer, { skipSelf: true })
        : null;
      return resolved?.id ?? rewritten;
    },
  };
}

export function createNpmPrewarm(
  configPath: t.StringPath,
  options: { loadImports?: LoadImports; warmNpm?: WarmNpm } = {},
): t.VitePlugin {
  const loadImports = options.loadImports ?? wrangle.loadImports;
  const warmNpm = options.warmNpm ?? wrangle.warmNpm;
  let warmed = false;

  return {
    name: 'sys:npm-prewarm',
    async buildStart() {
      if (warmed) return;
      warmed = true;

      const imports = await loadImports(configPath);
      const cwd = Path.dirname(configPath);
      const specifiers = Object.values(imports)
        .map((target) => wrangle.toNpmWarmSpecifier(target))
        .filter((value): value is string => Boolean(value));

      for (const specifier of new Set(specifiers)) {
        await warmNpm(specifier, cwd);
      }
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
      const matches = key.endsWith('/')
        ? specifier.startsWith(key)
        : (specifier === key || specifier.startsWith(`${key}/`));
      if (!matches) continue;
      const candidate = { target, suffix: specifier.slice(key.length), len: key.length };
      if (!best || candidate.len > best.len) best = candidate;
    }
    return best;
  },

  stripPrefix(input: string, prefix: string) {
    return input.startsWith(prefix) ? input.slice(prefix.length) : '';
  },

  toNpmWarmSpecifier(target: string): string | undefined {
    if (!target.startsWith('npm:')) return undefined;
    return target.endsWith('/') ? target.slice(0, -1) : target;
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

  async warmNpm(specifier: string, cwd: string) {
    const cmd = new Deno.Command(Deno.execPath(), {
      args: ['info', '--json', specifier],
      cwd,
      stdout: 'null',
      stderr: 'piped',
    });
    const output = await cmd.output();
    if (output.success) return;

    const stderr = new TextDecoder().decode(output.stderr).trim();
    throw new Error(stderr || `Failed to warm npm specifier: ${specifier}`);
  },
} as const;
