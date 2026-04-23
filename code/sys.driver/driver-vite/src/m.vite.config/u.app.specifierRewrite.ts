import { Perf } from '../common/u.perf.ts';
import { type t, DenoFile, Fs, Is, Json, Path } from './common.ts';
import { isBarePackageId } from '../m.vite.transport/u.npm.ts';

type LoadImports = (configPath: t.StringPath) => Promise<Record<string, string>>;
type WarmNpm = (specifier: string, cwd: string) => Promise<void>;

export function createSpecifierRewrite(
  configPath: t.StringPath,
  options: { loadImports?: LoadImports } = {},
): t.VitePlugin {
  const rewriteSpecifier = wrangle.rewriteSpecifier(configPath, options.loadImports);
  const resolutionImporter = wrangle.resolutionImporter(configPath);

  return {
    name: 'sys:specifier-rewrite',
    enforce: 'pre',
    async resolveId(
      source: string,
      importer: string | undefined,
      options: { custom?: t.Rollup.CustomPluginOptions; ssr?: boolean; isEntry: boolean },
    ) {
      const rewritten = await rewriteSpecifier(source);
      if (!rewritten) return null;
      const importerForResolve = wrangle.isDenoImporter(importer) ? resolutionImporter : importer;
      const resolved = await this.resolve(rewritten, importerForResolve, { ...options, skipSelf: true });
      if (resolved?.id) return resolved.id;
      if (isBarePackageId(rewritten)) return null;
      return rewritten;
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

      const end = Perf.section('config.npmPrewarm', { configPath }, { level: 2 });
      const imports = await loadImports(configPath);
      const cwd = Path.dirname(configPath);
      const specifiers = Object.values(imports)
        .map((target) => wrangle.toNpmWarmSpecifier(target))
        .filter((value): value is string => Boolean(value));
      const uniqueSpecifiers = [...new Set(specifiers)];

      for (const specifier of uniqueSpecifiers) {
        const startedAt = Perf.section('config.npmPrewarm.specifier', { specifier, cwd }, { level: 3 });
        await warmNpm(specifier, cwd);
        startedAt();
      }

      end({ imports: Object.keys(imports).length, specifiers: uniqueSpecifiers.length });
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
        const bare = isBarePackageId(specifier);

        const map = await imports;
        const fromMap = resolveFromImportsMap(specifier, map);
        if (!fromMap) return undefined;
        if (fromMap.startsWith('npm:')) {
          const rewritten = parseNpmSpecifier(fromMap);
          if (bare && rewritten === specifier) return undefined;
          return rewritten;
        }
        if (fromMap.startsWith('jsr:')) return undefined;
        return fromMap;
      })();
      cache.set(specifier, promise);
      return await promise;
    };
  },

  async loadImports(configPath: t.StringPath): Promise<Record<string, string>> {
    const end = Perf.section('config.loadImports', { configPath }, { level: 2 });
    const file = await DenoFile.load(configPath);
    if (!file.ok || !file.data) {
      end({ ok: false, imports: 0 });
      return {};
    }


    const denoImports = wrangle.toStringRecord(file.data.imports);
    const importMapPath = file.data.importMap ? wrangle.resolveImportMapPath(file.path, file.data.importMap) : undefined;
    if (!importMapPath) {
      end({ importMap: false, imports: Object.keys(denoImports).length });
      return denoImports;
    }

    const importMap = await Fs.readJson<t.DenoImportMapJson>(importMapPath);
    if (!importMap.ok || !importMap.data) {
      end({ importMap: importMapPath, imports: Object.keys(denoImports).length });
      return denoImports;
    }

    const mapImports = wrangle.toStringRecord(importMap.data.imports);
    const merged = { ...mapImports, ...denoImports };
    end({ importMap: importMapPath, imports: Object.keys(merged).length, mapImports: Object.keys(mapImports).length });
    return merged;
  },

  resolveImportMapPath(configPath: t.StringPath, importMapPath: t.StringPath) {
    const dir = Path.dirname(configPath);
    return Path.resolve(dir, importMapPath);
  },

  resolutionImporter(configPath: t.StringPath) {
    return Path.resolve(configPath);
  },

  toStringRecord(input: unknown): Record<string, string> {
    const res: Record<string, string> = {};
    if (!Is.record<Record<string, unknown>>(input)) return res;
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

  isDenoImporter(importer?: string) {
    if (!importer) return false;
    return importer.startsWith('\0deno::') || importer.startsWith('/@id/__x00__deno::');
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
    const startedAt = Perf.section('config.npmPrewarm.info', { specifier }, { level: 3 });
    const output = await cmd.output();
    startedAt({ success: output.success });
    if (output.success) return;

    const stderr = new TextDecoder().decode(output.stderr).trim();
    throw new Error(stderr || `Failed to warm npm specifier: ${specifier}`);
  },
} as const;
