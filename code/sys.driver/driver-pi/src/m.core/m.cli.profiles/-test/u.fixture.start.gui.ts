import { Fs, type t } from '../common.ts';
import { Pkg as FsPkg } from '@sys/fs/pkg';
import { START_GUI_SERVICE } from '../u/u.start.gui.service.ts';

export type Started = t.HttpServer.Started;
export type Keyboard = t.Cli.Keyboard.Bind.Handle;

export function asProfileRoot(root: t.StringDir): t.PiCli.Cwd {
  return {
    root,
    git: root,
    invoked: root,
  };
}

export function fakeGeneration(
  pkg: Readonly<t.Pkg> = START_GUI_SERVICE.source.expectedPkg,
  source: Readonly<{
    integrity?: t.StringHash;
    manifestUrl?: t.StringUrl;
  }> = {},
): t.Dist.Existing {
  return fakeGenerationWithPkgEvidence({
    pkg: Object.freeze({ name: pkg.name, version: pkg.version }),
    ...source,
  });
}

export function fakeGenerationWithPkgEvidence(
  input: Readonly<{
    pkg: unknown;
    omitPkg?: boolean;
    integrity?: t.StringHash;
    manifestUrl?: t.StringUrl;
  }>,
): t.Dist.Existing {
  const integrity = input.integrity ?? START_GUI_SERVICE.source.integrity;
  const manifestUrl = input.manifestUrl ?? START_GUI_SERVICE.source.manifestUrl;
  const dist = Object.freeze({
    type: 'https://jsr.io/@sample/driver-pi-gui',
    ...(input.omitPkg ? {} : { pkg: input.pkg }),
    build: Object.freeze({
      time: 0,
      size: Object.freeze({ total: 0, pkg: 0 }),
      builder: '@sample/builder@1.0.0',
      runtime: '<runtime-uri>',
      hash: Object.freeze({ policy: 'https://jsr.io/@sample/hash/0.0.1/src/hash.ts' }),
    }),
    hash: Object.freeze({ digest: integrity, parts: Object.freeze({}) }),
  });
  const verification = Object.freeze({
    integrity,
    dist,
    manifestBytes: 0,
    assets: Object.freeze({ files: 0, totalBytes: 0, packageBytes: 0 }),
  });

  return Object.freeze({
    kind: 'existing',
    dir: '/tmp/driver-pi-gui-generation' as t.StringAbsoluteDir,
    integrity,
    verification,
    source: Object.freeze({ configuredUrl: manifestUrl }),
    seal: Object.freeze({ kind: 'applied', changed: false }),
    cleanup: 'not-needed',
  }) as t.Dist.Existing;
}

export function deferred(): { readonly promise: Promise<void>; readonly resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

export function startedFixture(input: {
  close?: (reason: unknown) => Promise<void>;
  finished?: Promise<void>;
} = {}): Started {
  return {
    origin: 'http://127.0.0.1:1234' as t.StringUrl,
    close: input.close ?? (() => Promise.resolve()),
    finished: input.finished ?? Promise.resolve(),
  } as Started;
}

export async function rejectionOf(action: () => Promise<unknown>): Promise<Error> {
  try {
    await action();
  } catch (cause) {
    return cause instanceof Error ? cause : new Error(String(cause));
  }
  throw new Error('Expected rejection.');
}

/** Remove a test Dist store through its lower owned-tree lifecycle authority. */
export async function removeDistStore(storeDir: t.StringDir): Promise<void> {
  if (!(await Fs.exists(storeDir))) return;

  const parent = Fs.dirname(storeDir) as t.StringDir;
  const rooted = await Fs.Capability.Rooted.create({ root: parent });
  const admitted = await rooted.admit([
    { path: Fs.basename(storeDir), kind: 'directory' },
  ]);
  const target = admitted.targets[0];
  const acquired = await rooted.acquireLease([target], { mode: 'exclusive' });
  if (acquired.kind !== 'acquired') throw new Error('Dist test store is busy.');
  try {
    await rooted.removeTree(target, { lease: acquired.lease });
  } finally {
    await acquired.lease.release();
  }
}

export async function loopbackDistFixture() {
  const source = (await Fs.makeTempDir({ prefix: 'driver-pi.start-gui.source.' }))
    .absolute as t.StringDir;
  await Fs.write(Fs.join(source, 'index.html'), '<h1>verified driver-pi fixture</h1>');
  await Fs.write(Fs.join(source, 'assets/app.js'), 'console.info("verified");');
  await Fs.write(
    Fs.join(source, 'sw.js'),
    `self.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()));`,
  );
  const expectedPkg = Object.freeze({
    name: '@sample/driver-pi-gui' as t.StringPkgName,
    version: '1.0.0' as t.StringSemver,
  });
  const computed = await FsPkg.Dist.compute({
    dir: source,
    pkg: expectedPkg,
    builder: { name: '@sample/builder', version: '1.0.0' },
    save: true,
  });
  const assets = new Map<string, Uint8Array>();
  for (const path of Object.keys(computed.dist.hash.parts)) {
    assets.set(`/${path}`, await Deno.readFile(Fs.join(source, path)));
  }
  const manifest = await Deno.readFile(Fs.join(source, 'dist.json'));
  const server = Deno.serve({ hostname: '127.0.0.1', port: 0, onListen() {} }, (request) => {
    const path = new URL(request.url).pathname;
    if (path === '/dist.json') return new Response(manifest);
    const asset = assets.get(path);
    return asset ? new Response(asset.buffer as ArrayBuffer) : new Response(null, { status: 404 });
  });
  const address = server.addr as Deno.NetAddr;
  const origin = `http://127.0.0.1:${address.port}` as t.StringUrl;

  return {
    integrity: computed.manifest.integrity,
    manifestUrl: `${origin}/dist.json` as t.StringUrl,
    expectedPkg,
    origin,
    async dispose() {
      const failures: unknown[] = [];
      try {
        await server.shutdown();
      } catch (cause) {
        failures.push(cause);
      }
      try {
        await Fs.remove(source);
      } catch (cause) {
        failures.push(cause);
      }
      if (failures.length === 1) throw failures[0];
      if (failures.length > 1) {
        throw new AggregateError(failures, 'Driver Pi source fixture cleanup failed.');
      }
    },
  };
}
