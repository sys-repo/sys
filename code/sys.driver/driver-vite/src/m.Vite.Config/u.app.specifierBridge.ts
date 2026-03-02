import { type t, Is, Json, Process } from './common.ts';

type ResolveSysSpecifier = (configPath: t.StringPath, specifier: string) => Promise<string | undefined>;

export function createSpecifierBridge(
  configPath: t.StringPath,
  options: { resolveSysSpecifier?: ResolveSysSpecifier } = {},
): t.VitePlugin {
  const resolveSysSpecifier = wrangle.resolveSysSpecifier(configPath, options.resolveSysSpecifier);

  return {
    name: 'sys:specifier-bridge',
    enforce: 'pre',
    async resolveId(source) {
      if (source.startsWith('npm:')) return parseNpmSpecifier(source) ?? null;
      if (!source.startsWith('@sys/')) return null;
      return (await resolveSysSpecifier(source)) ?? null;
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
  const parsed = Json.safeParse<{ roots?: string[] }>(input);
  if (!parsed.ok) return undefined;
  const root = parsed.data?.roots?.[0];
  return Is.string(root) ? root : undefined;
}

const wrangle = {
  resolveSysSpecifier(
    configPath: t.StringPath,
    resolveSysSpecifier?: ResolveSysSpecifier,
  ): (specifier: string) => Promise<string | undefined> {
    const resolve = resolveSysSpecifier ?? wrangle.resolveSysSpecifierViaDenoInfo;
    const cache = new Map<string, Promise<string | undefined>>();

    return async (specifier) => {
      const cached = cache.get(specifier);
      if (cached) return await cached;

      const promise = resolve(configPath, specifier);
      cache.set(specifier, promise);
      return await promise;
    };
  },

  async resolveSysSpecifierViaDenoInfo(configPath: t.StringPath, specifier: string) {
    const res = await Process.invoke({
      cmd: 'deno',
      args: ['info', '--json', '--config', configPath, specifier],
      silent: true,
    });
    if (!res.success) return undefined;
    return parseDenoInfoRoot(res.text.stdout);
  },
} as const;
