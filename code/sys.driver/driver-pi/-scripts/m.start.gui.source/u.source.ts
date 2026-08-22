import { Err, Fs, FsDist, Is, Json, Num, Obj, Pkg, serveFileBytes, type t } from './common.ts';
import type { GuiDistSource } from './t.ts';

export const HOSTNAME: t.StringHostname = '127.0.0.1';
export const PORT: t.PortNumber = 8080;
export const ORIGIN: t.StringUrl = 'http://localhost:8080';
export const MANIFEST_ROUTE = '/dist.json';
const MAX_MANIFEST_BYTES = 16 * 1024 * 1024;
const MAX_PART_BYTES = 128 * 1024 * 1024;
const PACKAGE_ROOT: t.StringAbsoluteDir = Fs.resolve(import.meta.dirname ?? '.', '../..');
export const DIST_DIR: t.StringAbsoluteDir = Fs.join(PACKAGE_ROOT, 'dist');

type Part = Readonly<{
  path: string;
  target: t.FsRooted.Target<'file'>;
}>;

/** Load one frozen development Dist source without building or mutating it. */
export async function loadGuiDistSource(dirInput: t.StringDir): Promise<GuiDistSource> {
  const selected: t.StringAbsoluteDir = Fs.resolve(dirInput);
  const rootInfo = await Fs.lstat(selected);
  if (!rootInfo) throw Err.std('Driver Pi GUI Dist source is missing dist.json.');
  if (!rootInfo.isDirectory || rootInfo.isSymlink) {
    throw Err.std('Driver Pi GUI Dist source manifest path is unsafe.');
  }

  let rooted: t.FsRooted.Instance;
  let manifestRead: t.FsRooted.ReadFileResult;
  try {
    rooted = await Fs.Capability.Rooted.create({ root: selected, create: false });
    const admission = await rooted.admit([{ kind: 'file', path: 'dist.json' }]);
    const target = admission.targets[0];
    if (!target) throw Err.std('Driver Pi GUI Dist source manifest path is unsafe.');
    manifestRead = await rooted.readFile(target, { maxBytes: MAX_MANIFEST_BYTES });
  } catch {
    throw Err.std('Driver Pi GUI Dist source manifest path is unsafe.');
  }
  if (manifestRead.kind === 'absent') {
    throw Err.std('Driver Pi GUI Dist source is missing dist.json.');
  }
  const manifest = Uint8Array.from(manifestRead.bytes);

  const decoded = decodeManifest(manifest);
  const parsed = Json.safeParse<unknown>(decoded);
  if (!(parsed.ok && Pkg.Is.dist(parsed.data))) {
    throw Err.std('Driver Pi GUI Dist source manifest is malformed.');
  }

  const routes = await routesOf(rooted, parsed.data.hash.parts);
  return Object.freeze({
    dir: rooted.path,
    async fetch(request) {
      const route = requestRoute(request);
      if (!route) return refusal();

      if (route === MANIFEST_ROUTE) {
        return await serveFileBytes({
          req: request,
          path: 'dist.json',
          cache: 'no-store',
          read: () => Promise.resolve({ kind: 'bytes', bytes: manifest }),
        });
      }

      const part = routes.get(route);
      if (!part) return refusal();
      return await serveFileBytes({
        req: request,
        path: part.path,
        cache: 'no-store',
        read: async () => {
          const result = await rooted.readFile(part.target, { maxBytes: MAX_PART_BYTES });
          return result.kind === 'read'
            ? { kind: 'bytes', bytes: result.bytes }
            : { kind: 'missing' };
        },
      });
    },
  });
}

function decodeManifest(bytes: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw Err.std('Driver Pi GUI Dist source manifest is malformed.');
  }
}

async function routesOf(
  rooted: t.FsRooted.Instance,
  parts: Record<string, unknown>,
): Promise<ReadonlyMap<string, Part>> {
  const candidates: Readonly<{ path: string }>[] = [];
  for (const [path, authority] of Obj.entries(parts)) {
    const part = FsDist.Part.parse(authority);
    if (!part || !Num.Is.safeInt(part.size) || part.size < 0) {
      throw Err.std('Driver Pi GUI Dist source manifest is malformed.');
    }
    candidates.push(Object.freeze({ path }));
  }

  if (candidates.length === 0) {
    throw Err.std('Driver Pi GUI Dist source manifest is malformed.');
  }

  let admitted: t.FsRooted.Admission<'file'>;
  try {
    admitted = await rooted.admit([
      { kind: 'file', path: 'dist.json' },
      ...candidates.map((part) => ({ kind: 'file' as const, path: part.path })),
    ]);
  } catch {
    throw Err.std('Driver Pi GUI Dist source manifest contains an unsafe route.');
  }

  const routes = new Map<string, Part>();
  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    const target = admitted.targets[index + 1];
    if (!candidate || !target || target.path !== candidate.path || candidate.path === 'dist.json') {
      throw Err.std('Driver Pi GUI Dist source manifest contains an unsafe route.');
    }

    let read: t.FsRooted.ReadFileResult;
    try {
      read = await rooted.readFile(target, { maxBytes: MAX_PART_BYTES });
    } catch {
      throw Err.std('Driver Pi GUI Dist source manifest contains an unsafe route.');
    }
    if (read.kind === 'absent') {
      throw Err.std('Driver Pi GUI Dist source is missing a declared part.');
    }

    const route = routeOf(target.path);
    if (routes.has(route)) {
      throw Err.std('Driver Pi GUI Dist source manifest routes are ambiguous.');
    }
    routes.set(route, Object.freeze({ path: candidate.path, target }));
  }
  return routes;
}

function routeOf(path: string): string {
  if (!Is.string(path) || path.length === 0) {
    throw Err.std('Driver Pi GUI Dist source manifest contains an unsafe route.');
  }

  try {
    const route = `/${path.split('/').map(encodeURIComponent).join('/')}`;
    const url = new URL(route, ORIGIN);
    if (url.origin !== ORIGIN || url.pathname !== route || url.search || url.hash) {
      throw Err.std('Driver Pi GUI Dist source manifest contains an unsafe route.');
    }
    return route;
  } catch {
    throw Err.std('Driver Pi GUI Dist source manifest contains an unsafe route.');
  }
}

function requestRoute(request: Request): string | undefined {
  try {
    const url = new URL(request.url);
    if (url.origin !== ORIGIN || url.search || url.hash) return;
    return url.pathname;
  } catch {
    return;
  }
}

function refusal(): Response {
  return new Response(null, {
    status: 404,
    headers: {
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}
