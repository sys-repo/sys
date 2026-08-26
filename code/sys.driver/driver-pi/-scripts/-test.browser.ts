import {
  Browser,
  describe,
  DistServer,
  Err,
  expect,
  Fs,
  FsDist,
  Hash,
  it,
  Json,
  serveFileBytes,
  type t,
  Testing,
} from './common.ts';
import { pkg } from '../src/pkg.ts';
import { VERIFIED_LOOPBACK_BROWSER_POLICY } from '../src/m.core/m.cli.profiles/u.start/u.browser.ts';
import { LIMITS } from '../src/m.core/m.cli.profiles/u.start/u.limits.ts';
import { START_GUI_SERVICE } from '../src/m.core/m.cli.profiles/u/u.start.gui.service.ts';

const CWD = Fs.Path.fromFileUrl(new URL('../', import.meta.url));
const DIST_DIR = Fs.join(CWD, 'dist') as t.StringDir;
const DIST_MANIFEST = Fs.join(DIST_DIR, 'dist.json');
const TEST_TMP_DIR = Fs.join(CWD, '.tmp');
const WORKSPACE_ROOT = Fs.resolve(CWD, '../../..');
const PROTECTED_WRITES = [
  DIST_DIR,
  Fs.join(CWD, '.pi'),
  Fs.join(WORKSPACE_ROOT, '.pi'),
  Fs.join(CWD, 'src/m.core/m.cli.profiles/u/u.start.gui.service.evidence.ts'),
] as const;
const ASSERT_RELEASE_EVIDENCE = Deno.env.get('SYS_DRIVER_PI_RELEASE_EVIDENCE') === '1';
const OWNED_CACHE = `${pkg.name}:asset-files`;
const UNRELATED_CACHE = `${pkg.name}-neighbor:asset-files`;

const LEGACY_CLAIMING_WORKER = `
  self.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()));
  self.addEventListener('activate', (event) => {
    event.waitUntil(Promise.all([
      caches.open(${Json.stringify(OWNED_CACHE)}),
      caches.open(${Json.stringify(UNRELATED_CACHE)}),
      self.clients.claim(),
    ]));
  });
`;

const LEGACY_REGISTER_PAGE = `<!doctype html>
  <title>Driver Pi legacy claiming worker</title>
  <link rel="icon" href="data:," />
  <script type="module">
    await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      type: 'module',
      updateViaCache: 'none',
    });
    await navigator.serviceWorker.ready;
  </script>`;

describe('Driver Pi verified-loopback Service Worker policy', () => {
  if (ASSERT_RELEASE_EVIDENCE) {
    it('denies protected writes, wildcard bind, and the operator source port', async () => {
      expect(await permissionState({ name: 'write', path: TEST_TMP_DIR })).to.eql('granted');
      for (const path of PROTECTED_WRITES) {
        expect(await permissionState({ name: 'write', path })).to.eql('denied');
      }
      expect(await permissionState({ name: 'env', variable: 'DENO_DIR' })).to.eql('denied');
      expect(await permissionState({ name: 'net', host: '0.0.0.0' })).to.eql('denied');
      expect(
        await permissionState({ name: 'net', host: '127.0.0.1:8080' }),
      ).to.eql('denied');
    });
  }

  it('rejects development and launcher markers in arbitrary emitted bytes', () => {
    const encoder = new TextEncoder();
    for (
      const marker of [
        '@sys/ui-dev',
        'DevHarness',
        START_GUI_SERVICE.source.manifestUrl,
        START_GUI_SERVICE.source.integrity,
      ]
    ) {
      const assets = new Map([['fixture.bin', encoder.encode(`prefix:${marker}:suffix`)]]);
      expect(() => proveProductionGraph(assets)).to.throw(marker);
    }
  });

  it('keeps emitted assets free of development and launcher authority', async () => {
    proveProductionGraph(await readAssets(await loadBuild()));
  });

  it('denies fresh registration and migrates the former claiming worker to the exact tombstone', async () => {
    await Fs.ensureDir(TEST_TMP_DIR);
    await withCandidatePreserved(async ({ build, assets }) => {
      await proveFreshVerifiedLoopback(build, assets);
      await proveClaimingWorkerMigration(assets);
    });
  });
});

type Build = {
  readonly dir: t.StringDir;
  readonly integrity: t.StringHash;
  readonly dist: t.DeepReadonly<t.DistPkg>;
};
type CandidateSnapshot = Readonly<{
  build: Build;
  manifest: Uint8Array;
  assets: ReadonlyMap<string, Uint8Array>;
}>;

function proveProductionGraph(assets: ReadonlyMap<string, Uint8Array>) {
  const encoder = new TextEncoder();

  // Production must eliminate the real DevHarness import and its runtime name.
  const developmentOnlyMarkers = ['@sys/ui-dev', 'DevHarness'].map((value) => ({
    value,
    bytes: encoder.encode(value),
  }));

  // Launcher acquisition authority belongs outside emitted browser assets.
  const launcherAuthorityMarkers = [
    START_GUI_SERVICE.source.manifestUrl,
    START_GUI_SERVICE.source.integrity,
  ].map((value) => ({ value, bytes: encoder.encode(value) }));

  for (const [path, bytes] of assets) {
    for (const marker of developmentOnlyMarkers) {
      if (includesBytes(bytes, marker.bytes)) {
        throw Err.std(
          `Production Driver Pi Dist retained real development-only marker ${marker.value}: ${path}`,
        );
      }
    }
    for (const marker of launcherAuthorityMarkers) {
      if (includesBytes(bytes, marker.bytes)) {
        throw Err.std(
          `Production Driver Pi Dist embedded launcher-owned acquisition authority ${marker.value}: ${path}`,
        );
      }
    }
  }
}

function includesBytes(source: Uint8Array, marker: Uint8Array): boolean {
  search: for (let index = 0; index <= source.length - marker.length; index += 1) {
    for (let offset = 0; offset < marker.length; offset += 1) {
      if (source[index + offset] !== marker[offset]) continue search;
    }
    return true;
  }
  return false;
}

async function proveFreshVerifiedLoopback(
  build: Build,
  assets: ReadonlyMap<string, Uint8Array>,
) {
  requireAsset(assets, '/sw.js');
  const started = await DistServer.start({
    dir: build.dir,
    integrity: build.integrity,
    limits: LIMITS,
    hostname: '127.0.0.1',
    port: 0,
    browserPolicy: VERIFIED_LOOPBACK_BROWSER_POLICY,
    silent: true,
  });

  try {
    expect(started.browserPolicy?.origin).to.eql(started.origin);
    expect(started.browserPolicy?.dedicatedWorkers).to.eql([]);
    expect(started.browserPolicy?.serviceWorker).to.eql({ kind: 'tombstone', path: 'sw.js' });
    await proveHostServiceWorkerPolicy(started.origin, requireAsset(assets, '/sw.js'));

    const result = await Browser.ServiceWorker.scenario({
      steps: [
        { kind: 'navigate', url: started.origin },
        { kind: 'observe', expect: { kind: 'controller', state: 'absent' } },
        { kind: 'observe', expect: { kind: 'registrations', count: 0 } },
      ],
      settle: 100,
      timeout: 15_000,
    });

    if (!result.ok) console.info(result);
    expect(result.ok).to.eql(true);
    expect(result.attestation).to.eql('controlled-run-only');
  } finally {
    await started.close('driver-pi.browser.fresh-loopback');
  }
}

async function proveHostServiceWorkerPolicy(origin: t.StringUrl, worker: Uint8Array) {
  const headers = {
    'sec-fetch-dest': 'serviceworker',
    'sec-fetch-site': 'same-origin',
  };
  const admitted = await fetch(new URL('/sw.js', origin), { headers });
  expect(admitted.status).to.eql(200);
  expect(admitted.headers.get('cache-control')).to.eql('no-store');
  expect(new Uint8Array(await admitted.arrayBuffer())).to.eql(worker);

  const refused = await fetch(new URL('/index.html', origin), { headers });
  expect(refused.status).to.eql(403);
  expect(refused.headers.get('cache-control')).to.eql('no-store');
  await refused.arrayBuffer();
}

async function proveClaimingWorkerMigration(assets: ReadonlyMap<string, Uint8Array>) {
  const builtIndex = requireAsset(assets, '/index.html');
  const builtWorker = requireAsset(assets, '/sw.js');
  let pageRequests = 0;
  let workerRequests = 0;

  const server = Testing.Http.server(async (request) => {
    const pathname = new URL(request.url).pathname;
    if (pathname === '/') {
      pageRequests += 1;
      if (pageRequests === 1) return html(LEGACY_REGISTER_PAGE);
      return await asset(request, 'index.html', builtIndex);
    }
    if (pathname === '/sw.js') {
      workerRequests += 1;
      if (workerRequests === 1) return javascript(LEGACY_CLAIMING_WORKER);
      return await asset(request, 'sw.js', builtWorker);
    }

    const bytes = assets.get(pathname);
    if (!bytes) return new Response(null, { status: 404 });
    return await asset(request, pathname.slice(1), bytes);
  });

  try {
    const origin = new URL(server.url.raw).origin;
    const scope = `${origin}/` as t.StringUrl;
    const scriptURL = `${origin}/sw.js` as t.StringUrl;
    const result = await Browser.ServiceWorker.scenario({
      steps: [
        { kind: 'navigate', url: scope },
        { kind: 'observe', expect: { kind: 'controller', state: 'present', scriptURL } },
        {
          kind: 'observe',
          expect: { kind: 'worker', scope, slot: 'active', state: 'activated', scriptURL },
        },
        { kind: 'observe', expect: { kind: 'cache', name: OWNED_CACHE, state: 'present' } },
        { kind: 'observe', expect: { kind: 'cache', name: UNRELATED_CACHE, state: 'present' } },
        { kind: 'update', scope },
        { kind: 'reload' },
        { kind: 'observe', expect: { kind: 'controller', state: 'absent' } },
        { kind: 'observe', expect: { kind: 'registration', scope, state: 'absent' } },
        { kind: 'observe', expect: { kind: 'cache', name: OWNED_CACHE, state: 'absent' } },
        { kind: 'observe', expect: { kind: 'cache', name: UNRELATED_CACHE, state: 'present' } },
      ],
      settle: 100,
      timeout: 15_000,
    });

    if (!result.ok) console.info(result);
    expect(result.ok).to.eql(true);
    expect(result.steps[5].outcome).to.eql({
      kind: 'update',
      scope,
      matches: 1,
      requested: true,
    });
    expect(result.attestation).to.eql('controlled-run-only');
    expect(workerRequests >= 2).to.eql(true);
    expect(pageRequests >= 2).to.eql(true);
  } finally {
    await server.dispose();
  }
}

async function withCandidatePreserved(
  operation: (snapshot: CandidateSnapshot) => Promise<void>,
): Promise<void> {
  const before = await candidateSnapshot();
  const expectedManifest = before.manifest.slice();
  const expectedAssets = new Map<string, Uint8Array>();
  for (const [path, bytes] of before.assets) expectedAssets.set(path, bytes.slice());

  let operationFailed = false;
  let operationFailure: unknown;
  try {
    await operation(before);
  } catch (cause) {
    operationFailed = true;
    operationFailure = cause;
  }

  let preservationFailed = false;
  let preservationFailure: unknown;
  try {
    const after = await candidateSnapshot();
    expect(after.manifest).to.eql(expectedManifest);
    expect(after.assets.size).to.eql(expectedAssets.size);
    for (const [path, bytes] of expectedAssets) expect(after.assets.get(path)).to.eql(bytes);
  } catch (cause) {
    preservationFailed = true;
    preservationFailure = cause;
  }

  if (operationFailed && preservationFailed) {
    throw new SuppressedError(
      operationFailure,
      preservationFailure,
      'Driver Pi browser proof failed and the frozen candidate also changed.',
    );
  }
  if (operationFailed) throw operationFailure;
  if (preservationFailed) throw preservationFailure;
}

async function candidateSnapshot(): Promise<CandidateSnapshot> {
  const build = await loadBuild();
  return Object.freeze({
    build,
    manifest: await Deno.readFile(DIST_MANIFEST),
    assets: await readAssets(build),
  });
}

async function loadBuild(): Promise<Build> {
  const manifest = await Fs.read(DIST_MANIFEST);
  if (!(manifest.ok && manifest.data)) {
    throw Err.std('Driver Pi browser build is missing dist.json.');
  }

  const integrity = Hash.sha256(manifest.data);
  const verified = await FsDist.Pinned.verify({ dir: DIST_DIR, integrity, limits: LIMITS });
  if (verified.kind !== 'verified') {
    throw Err.std(`Driver Pi browser build verification failed: ${verified.kind}`);
  }
  expect(verified.evidence.dist.pkg).to.eql(pkg);
  if (ASSERT_RELEASE_EVIDENCE) {
    expect(integrity).to.eql(START_GUI_SERVICE.source.integrity);
    expect(verified.evidence.dist.pkg).to.eql(START_GUI_SERVICE.source.expectedPkg);
  }
  return {
    dir: DIST_DIR,
    integrity,
    dist: verified.evidence.dist,
  };
}

async function readAssets(build: Build): Promise<ReadonlyMap<string, Uint8Array>> {
  const assets = new Map<string, Uint8Array>();
  for (const [path, value] of Object.entries(build.dist.hash.parts)) {
    const part = FsDist.Part.parse(value);
    if (!part || part.size === undefined) {
      throw Err.std(`Invalid built Driver Pi asset authority: ${path}`);
    }
    const result = await FsDist.Pinned.readPart({
      dir: build.dir,
      path,
      checksum: part.hash,
      size: part.size,
    });
    if (result.kind !== 'read') {
      throw Err.std(`Built Driver Pi asset verification failed: ${path}/${result.kind}`);
    }
    assets.set(`/${path}`, result.bytes);
  }
  return assets;
}

function requireAsset(assets: ReadonlyMap<string, Uint8Array>, path: string): Uint8Array {
  const bytes = assets.get(path);
  if (!bytes) throw Err.std(`Missing built Driver Pi asset: ${path}`);
  return bytes;
}

async function asset(request: Request, path: string, bytes: Uint8Array): Promise<Response> {
  return await serveFileBytes({
    req: request,
    path,
    cache: 'no-store',
    read: () => Promise.resolve({ kind: 'bytes', bytes }),
  });
}

function html(body: string): Response {
  return new Response(body, {
    headers: {
      'cache-control': 'no-store',
      'content-type': 'text/html; charset=utf-8',
    },
  });
}

function javascript(body: string): Response {
  return new Response(body, {
    headers: {
      'cache-control': 'no-store',
      'content-type': 'text/javascript; charset=utf-8',
      'service-worker-allowed': '/',
    },
  });
}

async function permissionState(
  descriptor: Deno.PermissionDescriptor,
): Promise<PermissionState> {
  return (await Deno.permissions.query(descriptor)).state;
}
