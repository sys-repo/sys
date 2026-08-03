import { Hash } from '@sys/crypto/hash';
import { Testing } from '../../-test.ts';
import { Fs, FsPkg, Json, type t } from '../common.ts';

const encoder = new TextEncoder();
const roots = new Set<string>();

export type Fixture = Awaited<ReturnType<typeof setup>>;

/** Create one neutral loopback Dist source and isolated immutable-generation store. */
export async function setup() {
  const source = await Deno.realPath(
    await Deno.makeTempDir({ prefix: 'server-dist-source-' }),
  );
  const parent = await Deno.realPath(
    await Deno.makeTempDir({ prefix: 'server-dist-store-' }),
  );
  roots.add(source);
  roots.add(parent);

  await Deno.mkdir(Fs.join(source, 'assets'));
  await Deno.writeTextFile(Fs.join(source, 'index.html'), '<h1>verified</h1>');
  await Deno.writeTextFile(Fs.join(source, 'assets/app.js'), 'console.info("verified");');
  await Deno.writeTextFile(Fs.join(source, 'assets/data #1.txt'), 'encoded path');

  const computed = await FsPkg.Dist.compute({
    dir: source,
    pkg: { name: '@sample/foo', version: '1.0.0' },
    builder: { name: '@sample/builder', version: '1.0.0' },
    save: true,
  });
  const assets = new Map<string, Uint8Array<ArrayBuffer>>();
  for (const path of Object.keys(computed.dist.hash.parts)) {
    assets.set(`/${path}`, Uint8Array.from(await Deno.readFile(Fs.join(source, path))));
  }

  let manifest = await Deno.readFile(Fs.join(source, 'dist.json'));
  let integrity = computed.manifest.integrity;
  let redirectBase = '';
  let redirectLocation = '';
  let assetResponse: ((path: string, bytes: Uint8Array) => Response | undefined) | undefined;
  const calls: string[] = [];
  const authorizations: Array<string | null> = [];
  const gates = new Map<
    string,
    { readonly wait: Promise<void>; readonly observed: () => void }
  >();
  const server = Testing.Http.server(async (request) => {
    const url = new URL(request.url);
    calls.push(url.pathname);
    authorizations.push(request.headers.get('authorization'));
    const gate = gates.get(url.pathname);
    if (gate) {
      gate.observed();
      await gate.wait;
    }
    if (url.pathname === '/dist.json' && redirectLocation) {
      return new Response(null, {
        status: 302,
        headers: { location: redirectLocation },
      });
    }
    const manifestPath = `${redirectBase}/dist.json`;
    if (url.pathname === manifestPath) return new Response(manifest);
    const assetPath = redirectBase && url.pathname.startsWith(`${redirectBase}/`)
      ? url.pathname.slice(redirectBase.length)
      : url.pathname;
    const decodedPath = assetPath.split('/').map((segment) => decodeURIComponent(segment)).join(
      '/',
    );
    const asset = assets.get(decodedPath);
    if (!asset) return new Response(null, { status: 404 });
    return assetResponse?.(decodedPath, asset) ?? new Response(asset.buffer);
  });

  const origin = clientUrl(server.url.href);
  const manifestUrl = new URL('/dist.json?private=query#fragment', origin).href;
  const storeDir = Fs.join(parent, 'store');

  const policy: t.ServerDist.Policy = {
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

  const args = (
    overrides: Partial<t.ServerDist.MaterializeArgs> = {},
  ): t.ServerDist.MaterializeArgs => ({
    manifestUrl,
    integrity,
    storeDir,
    policy,
    ...overrides,
  });

  return {
    args,
    assets,
    authorizations,
    calls,
    get integrity() {
      return integrity;
    },
    get manifestBytes() {
      return manifest.slice();
    },
    manifestUrl,
    policy,
    server,
    redirectManifest(base = '/nested') {
      redirectBase = base;
      redirectLocation = `${base}/dist.json?redirected=private`;
    },
    redirectManifestTo(location: t.StringUrl) {
      redirectBase = '';
      redirectLocation = location;
    },
    respondToAsset(fn: (path: string, bytes: Uint8Array) => Response | undefined) {
      assetResponse = fn;
    },
    hold(path: string) {
      let release = () => {};
      let observed = () => {};
      const wait = new Promise<void>((resolve) => (release = resolve));
      const requested = new Promise<void>((resolve) => (observed = resolve));
      gates.set(path, { wait, observed });
      return { release, requested };
    },
    source,
    storeDir,
    /** Replace authenticated manifest bytes while retaining the original asset server. */
    setManifest(dist: t.DistPkg) {
      manifest = encoder.encode(Json.stringify(dist, 2));
      integrity = Hash.sha256(manifest);
      return integrity;
    },
    setManifestBytes(bytes: Uint8Array) {
      manifest = bytes.slice();
      integrity = Hash.sha256(manifest);
      return integrity;
    },
    cloneDist(): t.DeepMutable<t.DistPkg> {
      const value = Json.parse<t.DeepMutable<t.DistPkg>>(Json.stringify(computed.dist));
      if (!value) throw new Error('Failed to clone fixture manifest.');
      return value;
    },
  };
}

export async function teardown(fixture: Fixture) {
  await fixture.server.dispose();
  await cleanupRoots();
}

export async function cleanupRoots() {
  const pending = [...roots];
  roots.clear();
  await Promise.all(pending.map((path) => Deno.remove(path, { recursive: true }).catch(() => {})));
}

export function responsePolicy(
  origin: t.StringUrl,
  maxBytes: t.NumberBytes,
): t.HttpFetch.ResponsePolicy {
  return {
    maxBytes,
    timeout: 1000,
    maxRedirects: 2,
    progressInterval: 10,
    sourceOrigins: [new URL(origin).origin],
    credentialOrigins: [],
  };
}

function clientUrl(input: t.StringUrl): t.StringUrl {
  const url = new URL(input);
  if (url.hostname === '0.0.0.0') url.hostname = '127.0.0.1';
  return url.href;
}
