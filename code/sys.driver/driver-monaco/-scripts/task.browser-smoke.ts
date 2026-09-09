import { Browser, Err, Fs, Obj, serveFileBytes, Str, Testing, Vite } from './common.ts';

const cwd = Fs.Path.fromFileUrl(new URL('../', import.meta.url));
const nested = '/tools/monaco/';

await smokeDevelopment();

const build = await Vite.build({ cwd, silent: true });
if (!build.ok) {
  throw Err.std(
    `Monaco browser smoke could not build the production artifact.\n\n${build.toString()}`,
  );
}

const requests: Array<{ readonly path: string; readonly status: number }> = [];
const parts = build.dist.hash.parts;
const server = Testing.Http.server(async (request) => {
  const pathname = new URL(request.url).pathname;
  const relative = requestPath(pathname);
  if (relative === undefined || !Obj.hasOwn(parts, relative)) {
    requests.push({ path: pathname, status: 404 });
    return new Response(null, { status: 404 });
  }

  const source = await Fs.read(Fs.join(build.paths.cwd, build.paths.app.outDir, relative));
  const response = await serveFileBytes({
    req: request,
    path: relative,
    cache: 'no-store',
    read: async () => {
      if (!source.ok || !source.data) return { kind: 'missing' } as const;
      return { kind: 'bytes', bytes: source.data } as const;
    },
  });
  requests.push({ path: pathname, status: response.status });
  return response;
});

try {
  for (const mount of ['/', nested]) {
    const startedAt = requests.length;
    const url = new URL(`${mount}?monaco-smoke`, server.url.raw).href;
    const result = await Browser.load(url, { waitAfterLoad: 8_000 });
    const observed = requests.slice(startedAt);
    const failed = observed.filter((request) => request.status >= 400);
    const failedText = failed.map((request) => `${request.status} ${request.path}`).join(' | ');
    const runtimeRoot = `${mount}vs/`;
    const runtimeRequests = observed.filter((request) => request.path.startsWith(runtimeRoot));

    if (!result.ok || failed.length > 0 || runtimeRequests.length < 1) {
      throw Err.std(Str.dedent(`
        Monaco browser smoke failed at ${mount}.
        Browser errors: ${result.errors.join(' | ') || 'none'}
        Failed requests: ${failedText || 'none'}
        Runtime requests beneath ${runtimeRoot}: ${runtimeRequests.length}
      `));
    }

    for (const notice of ['LICENSE', 'ThirdPartyNotices.txt']) {
      const response = await fetch(new URL(`${mount}vs/${notice}`, server.url.raw), {
        signal: AbortSignal.timeout(5_000),
      });
      if (response.status !== 200) {
        throw Err.std(
          `Monaco browser smoke could not fetch ${mount}vs/${notice}: ${response.status}.`,
        );
      }
    }

    console.info(
      `Monaco browser smoke passed at ${mount} ` +
        `(${observed.length} requests, ${result.errors.length} browser errors).`,
    );
  }
} finally {
  await server.dispose();
}

async function smokeDevelopment() {
  const server = await Vite.dev({
    cwd,
    port: Testing.randomPort(),
    strictPort: true,
    silent: true,
  });
  try {
    const url = new URL('?monaco-smoke', server.url).href;
    const result = await Browser.load(url, { waitAfterLoad: 8_000 });
    if (!result.ok) {
      throw Err.std(
        `Monaco development browser smoke failed: ${result.errors.join(' | ') || 'unknown'}.`,
      );
    }
    console.info(
      `Monaco browser smoke passed in Vite development ` +
        `(${result.errors.length} browser errors).`,
    );
  } finally {
    await server.dispose();
  }
}

function requestPath(pathname: string): string | undefined {
  const mounted = pathname.startsWith(nested) ? pathname.slice(nested.length) : pathname.slice(1);
  let relative: string;
  try {
    relative = decodeURIComponent(mounted);
  } catch {
    return undefined;
  }
  return relative && !relative.endsWith('/') ? relative : `${relative}index.html`;
}
