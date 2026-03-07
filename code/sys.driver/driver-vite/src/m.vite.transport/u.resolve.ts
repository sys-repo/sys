import { Is, Json, Path, Process, type t } from './common.ts';
import { loadDenoModule } from './u.load.ts';

let checkedDenoInstall = false;
const DENO_BINARY = Deno.build.os === 'windows' ? 'deno.exe' : 'deno';

export function createResolvePlugin(cache: t.DenoCache) {
  let root = Path.cwd();

  return {
    name: 'deno',
    configResolved(config: { root: string }) {
      root = Path.normalize(config.root);
    },
    async resolveId(id: string, importer?: string) {
      if (isDenoSpecifier(id)) return;
      return await resolveViteSpecifier(id, cache, root, importer);
    },
    async load(id: string) {
      if (!isDenoSpecifier(id)) return;
      return await loadDenoModule(id);
    },
  };
}

function isResolveError(info: t.ResolveInfoError | t.ResolveInfoModule): info is t.ResolveInfoError {
  return 'error' in info && typeof info.error === 'string';
}

export async function resolveDeno(id: string, cwd: string): Promise<t.DenoResolved | null> {
  if (id.startsWith('\0')) return null;

  if (!checkedDenoInstall) {
    await ensureDenoInstalled(cwd);
    checkedDenoInstall = true;
  }

  const output = await Process.invoke({
    cmd: DENO_BINARY,
    args: ['info', '--json', id],
    cwd,
    silent: true,
  });
  if (!output.success) {
    const text = output.text.stderr || output.text.stdout || output.toString();
    if (text.includes('Integrity check failed')) throw new Error(text);
    return null;
  }

  const parsed = Json.safeParse<t.ResolveInfo>(output.text.stdout);
  if (!parsed.ok || !parsed.data) return null;
  const json = parsed.data;
  const actualId = json.roots[0];
  const redirected = json.redirects?.[actualId] ?? actualId;
  const mod = json.modules.find((info) => !isResolveError(info) && info.specifier === redirected);

  if (mod === undefined || isResolveError(mod)) return null;

  if (mod.kind === 'esm') {
    return {
      id: mod.local ?? '',
      kind: mod.kind,
      loader: mod.mediaType ?? null,
      dependencies: mod.dependencies ?? [],
    };
  }

  if (mod.kind === 'npm') {
    return {
      id: mod.npmPackage ?? '',
      kind: mod.kind,
      loader: null,
      dependencies: [],
    };
  }

  if (mod.kind === 'external') return null;
  throw new Error(`Unsupported: ${JSON.stringify(mod, null, 2)}`);
}

export async function resolveViteSpecifier(
  id: string,
  cache: t.DenoCache,
  posixRoot: string,
  importer?: string,
) {
  const root = Path.normalize(posixRoot);

  if (!id.startsWith('.') && !id.startsWith('/')) {
    try {
      id = import.meta.resolve(id);
    } catch {
      // Ignore unresolved import-map / module cases here.
    }
  }

  if (importer && isDenoSpecifier(importer)) {
    const { resolved: parent } = parseDenoSpecifier(importer);
    const cached = cache.get(parent);
    if (cached === undefined) return;

    const found = cached.dependencies.find((dep) => dep.specifier === id);
    if (found === undefined) return;

    id = found.code.specifier;
    if (id.startsWith('file://')) return Path.fromFileUrl(id);
  }

  const resolved = cache.get(id) ?? await resolveDeno(id, root);
  if (resolved === null) return;
  if (resolved.kind === 'npm') return null;

  cache.set(resolved.id, resolved);

  if (
    resolved.loader === null ||
    (resolved.id.startsWith(Path.resolve(root)) && !Path.relative(root, resolved.id).startsWith('.'))
  ) {
    return resolved.id;
  }

  return toDenoSpecifier(resolved.loader, id, resolved.id);
}

export function isDenoSpecifier(str: string) {
  return str.startsWith('\0deno');
}

export function toDenoSpecifier(loader: string, id: string, resolved: string) {
  return `\0deno::${loader}::${id}::${resolved}`;
}

export function parseDenoSpecifier(spec: string) {
  const [_, loader, id, posixPath] = spec.split('::');
  return {
    loader,
    id,
    resolved: Path.normalize(posixPath),
  };
}

async function ensureDenoInstalled(cwd: string) {
  const res = await Process.invoke({
    cmd: DENO_BINARY,
    args: ['--version'],
    cwd,
    silent: true,
  });
  if (!res.success) {
    const text = res.text.stderr || res.text.stdout || res.toString();
    throw new Error(text || 'Deno binary could not be found. Install Deno to resolve this error.');
  }
}
