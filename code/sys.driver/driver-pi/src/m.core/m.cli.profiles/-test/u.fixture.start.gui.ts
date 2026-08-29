import { FsPkg } from '../../../-test.ts';
import { Fs, type t, Url } from '../common.ts';
import { START_GUI_SERVICE } from '../u/u.start.gui.service.ts';

export type Started = t.DistServer.Started;
export type Keyboard = t.Cli.Keyboard.Bind.Handle;
export const DIST_DIGEST = `sha256-${'d'.repeat(59)}84346` as t.StringHash;

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
    digest?: t.StringHash;
    manifestUrl?: t.StringUrl;
    cleanup?: t.Dist.Cleanup;
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
    digest?: t.StringHash;
    manifestUrl?: t.StringUrl;
    cleanup?: t.Dist.Cleanup;
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
    hash: Object.freeze({ digest: input.digest ?? DIST_DIGEST, parts: Object.freeze({}) }),
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
    cleanup: input.cleanup ?? 'not-needed',
  }) as t.Dist.Existing;
}

export function deferred(): {
  readonly promise: Promise<void>;
  readonly resolve: () => void;
  readonly reject: (cause?: unknown) => void;
} {
  let resolve!: () => void;
  let reject!: (cause?: unknown) => void;
  const promise = new Promise<void>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

export type BootstrapStatusFixtureOptions = {
  url?: t.StringUrl;
  finished?: Promise<void>;
  close?: (reason?: unknown) => void | Promise<void>;
};

/** Create one truthful, memoized BootstrapStatus lifecycle double. */
export function bootstrapStatusFixture(
  options: BootstrapStatusFixtureOptions = {},
): t.BootstrapStatus.Started {
  const localFinished = deferred();
  const finished = options.finished ?? localFinished.promise;
  let disposed = false;
  let closeCompletion: Promise<void> | undefined;

  void finished.then(
    () => (disposed = true),
    () => (disposed = true),
  );

  const close = (reason?: unknown): Promise<void> => {
    if (closeCompletion) return closeCompletion;
    const completion = deferred();
    closeCompletion = completion.promise;
    void settle(reason, completion);
    return closeCompletion;
  };
  const asyncDispose = (): Promise<void> => close();

  return Object.freeze({
    url: options.url ??
      'http://127.0.0.1:45000/0123456789abcdefghijklmnopqrstuvwxyzabcd' as t.StringUrl,
    finished,
    get disposed() {
      return disposed;
    },
    close,
    [Symbol.asyncDispose]: asyncDispose,
  });

  async function settle(
    reason: unknown,
    completion: ReturnType<typeof deferred>,
  ): Promise<void> {
    let failed = false;
    let failure: unknown;
    try {
      await options.close?.(reason);
    } catch (cause) {
      failed = true;
      failure = cause;
    }

    if (!options.finished) localFinished.resolve();

    try {
      await finished;
    } catch (cause) {
      failed = true;
      failure ??= cause;
    }

    if (failed) completion.reject(failure);
    else completion.resolve();
  }
}

export function appliedBrowserPolicyFixture(
  origin: t.StringUrl,
): t.DistServer.BrowserPolicy.Applied {
  const parsed = Url.parse(origin);
  if (!parsed.ok) throw new Error('Invalid application-origin fixture.');
  const worker = `${origin}/sw.js`;
  const contentSecurityPolicy = [
    "default-src 'none'",
    "base-uri 'none'",
    `child-src ${worker}`,
    "connect-src 'self'",
    "font-src 'self'",
    "form-action 'none'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "img-src 'self' data:",
    "manifest-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    `worker-src ${worker}`,
  ].join('; ');
  return Object.freeze({
    kind: 'verified-loopback',
    origin,
    host: parsed.toURL().host,
    dedicatedWorkers: Object.freeze([]),
    serviceWorker: Object.freeze({ kind: 'tombstone', path: 'sw.js' }),
    fetchMetadata: Object.freeze({ crossSite: 'deny', missing: 'allow' }),
    headers: Object.freeze({
      cacheControl: 'no-store',
      contentSecurityPolicy,
      crossOriginOpenerPolicy: 'same-origin',
      crossOriginResourcePolicy: 'same-origin',
      referrerPolicy: 'no-referrer',
      xContentTypeOptions: 'nosniff',
      xFrameOptions: 'DENY',
    }),
  });
}

export function startedFixture(input: {
  close?: (reason: unknown) => Promise<void>;
  finished?: Promise<void>;
  pkg?: Readonly<t.Pkg>;
  integrity?: t.StringHash;
  digest?: t.StringHash;
} = {}): Started {
  const generation = fakeGeneration(input.pkg, {
    integrity: input.integrity,
    digest: input.digest,
  });
  const origin = 'http://127.0.0.1:1234' as t.StringUrl;
  const completion = deferred();
  const close = async (reason: unknown) => {
    await input.close?.(reason);
    if (!input.finished) completion.resolve();
  };
  return {
    addr: { transport: 'tcp', hostname: '127.0.0.1', port: 1234 },
    hostname: '127.0.0.1',
    port: 1234,
    origin,
    close,
    finished: input.finished ?? completion.promise,
    authority: Object.freeze({ kind: 'pinned', integrity: generation.integrity }),
    verification: generation.verification,
    browserPolicy: appliedBrowserPolicyFixture(origin),
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
  const acquired = await rooted.acquireLease([target], {
    mode: 'exclusive',
    wait: true,
  });
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
    const parsed = Url.parse(request.url);
    const path = parsed.ok ? parsed.toURL().pathname : '';
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
