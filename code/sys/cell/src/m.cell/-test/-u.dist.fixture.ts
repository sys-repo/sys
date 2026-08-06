import { Fs, Pkg } from '@sys/fs';
import type { Dist as ServerDist } from '@sys/server/t';
import { Testing } from '@sys/testing/server';

type MaterializeArgs = ServerDist.MaterializeArgs;
type MaterializePolicy = ServerDist.Policy;

export type DistFixture = {
  readonly args: (overrides?: Partial<MaterializeArgs>) => MaterializeArgs;
  readonly manifestUrl: string;
  readonly manifestBytes: Uint8Array;
  readonly integrity: string;
  readonly storeDir: string;
  readonly source: string;
  readonly policy: MaterializePolicy;
  readonly teardown: () => Promise<void>;
};

/**
 * Create one neutral loopback Dist source and isolated integrity-addressed store.
 */
export async function setupDistFixture(root: string): Promise<DistFixture> {
  const source = Fs.join(root, 'dist-source');
  const storeDir = Fs.join(root, 'dist-store');
  await Promise.all([
    Fs.remove(source, { recursive: true }).catch(() => undefined),
    Fs.remove(storeDir, { recursive: true }).catch(() => undefined),
  ]);

  await Fs.ensureDir(source);
  await Fs.ensureDir(storeDir);
  await Fs.write(
    Fs.join(source, 'index.html'),
    '<h1>neutral-dist</h1>',
    { force: true },
  );
  await Fs.write(
    Fs.join(source, 'assets/app.js'),
    'console.info("neutral-dist");',
    { force: true },
  );
  await Fs.write(
    Fs.join(source, 'assets/data #1.txt'),
    'encoded path',
    { force: true },
  );
  const canonicalSource = await Deno.realPath(source);
  const canonicalStoreDir = await Deno.realPath(storeDir);

  const computed = await Pkg.Dist.compute({
    dir: canonicalSource,
    pkg: { name: '@sample/foo', version: '1.0.0' },
    builder: { name: '@sample/builder', version: '1.0.0' },
    save: true,
  });

  const assets = new Map<string, Uint8Array<ArrayBuffer>>();
  for (const path of Object.keys(computed.dist.hash.parts)) {
    const bytes = new Uint8Array(await Deno.readFile(Fs.join(canonicalSource, path)));
    assets.set(`/${path}`, bytes as Uint8Array<ArrayBuffer>);
  }

  let manifest = await Deno.readFile(Fs.join(canonicalSource, 'dist.json'));
  let integrity = computed.manifest.integrity;

  const server = Testing.Http.server(async (request) => {
    const url = new URL(request.url);
    if (url.pathname === '/dist.json') return new Response(manifest);

    const decodedPath = url.pathname
      .split('/')
      .map((segment) => decodeURIComponent(segment))
      .join('/');
    const asset = assets.get(decodedPath);
    if (!asset) return new Response(null, { status: 404 });
    return new Response(asset);
  });

  const origin = clientUrl(server.url.href);
  const manifestUrl = new URL('/dist.json?private=query#fragment', origin).href;
  const policy: MaterializePolicy = {
    manifest: responsePolicy(origin, 1024 * 1024),
    resources: {
      response: responsePolicy(origin, 1024 * 1024),
      maxResources: 100,
      concurrency: 2,
      maxAttempts: 1,
      retryDelay: 0,
      maxRetryElapsed: 1000,
      maxTotalBytes: 4 * 1024 * 1024,
      totalTimeout: 2000,
    },
    verification: {
      manifestBytes: 1024 * 1024,
      entries: 100,
      fileBytes: 1024 * 1024,
      totalBytes: 4 * 1024 * 1024,
    },
  };

  const args = (overrides: Partial<MaterializeArgs> = {}): MaterializeArgs => ({
    manifestUrl,
    integrity,
    storeDir: canonicalStoreDir,
    policy,
    ...overrides,
  });

  return {
    source: canonicalSource,
    storeDir: canonicalStoreDir,
    args,
    manifestUrl,
    get manifestBytes() {
      return manifest.slice();
    },
    get integrity() {
      return integrity;
    },
    policy,
    async teardown() {
      await server.dispose();
      await Promise.all([
        Fs.remove(canonicalSource, { recursive: true }).catch(() => undefined),
        Fs.remove(canonicalStoreDir, { recursive: true }).catch(() => undefined),
      ]);
    },
  };
}

/**
 * Helpers:
 */
function responsePolicy(
  origin: string,
  maxBytes: number,
): MaterializePolicy['manifest'] {
  return {
    maxBytes,
    timeout: 1000,
    maxRedirects: 2,
    progressInterval: 10,
    sourceOrigins: [new URL(origin).origin],
    credentialOrigins: [],
  };
}

function clientUrl(input: string): string {
  const url = new URL(input);
  if (url.hostname === '0.0.0.0') url.hostname = '127.0.0.1';
  return url.href;
}
