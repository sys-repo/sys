import { Fs, Is, type t, Url } from '../common.ts';
import { START_GUI_SERVICE } from '../u/u.start.gui.service.ts';

export type Started = t.DistServer.Started;
export const DIST_DIGEST = `sha256-${'d'.repeat(59)}84346` as t.StringHash;
export const GENERATION_DIR = '/tmp/driver-pi-gui-generation' as t.StringAbsoluteDir;
export const GENERATION_HREF = Fs.Path.toFileUrl(GENERATION_DIR).href as t.StringUrl;

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
    dir?: t.StringAbsoluteDir;
  }> = {},
): t.Dist.Existing {
  const integrity = source.integrity ?? START_GUI_SERVICE.source.integrity;
  const manifestUrl = source.manifestUrl ?? START_GUI_SERVICE.source.manifestUrl;
  const dist = Object.freeze({
    type: 'https://jsr.io/@sample/driver-pi-gui',
    pkg: Object.freeze({ name: pkg.name, version: pkg.version }),
    build: Object.freeze({
      time: 0,
      size: Object.freeze({ total: 0, pkg: 0 }),
      builder: '@sample/builder@1.0.0',
      runtime: '<runtime-uri>',
      hash: Object.freeze({ policy: 'https://jsr.io/@sample/hash/0.0.1/src/hash.ts' }),
    }),
    hash: Object.freeze({ digest: source.digest ?? DIST_DIGEST, parts: Object.freeze({}) }),
  });
  const verification = Object.freeze({
    integrity,
    dist,
    manifestBytes: 0,
    assets: Object.freeze({ files: 0, totalBytes: 0, packageBytes: 0 }),
  });

  return Object.freeze({
    kind: 'existing',
    dir: source.dir ?? GENERATION_DIR,
    integrity,
    verification,
    source: Object.freeze({ configuredUrl: manifestUrl }),
    seal: Object.freeze({ kind: 'applied', changed: false }),
    cleanup: source.cleanup ?? 'not-needed',
  }) as t.Dist.Existing;
}

/** Create an exact frozen successful Generation-open settlement at the requested store. */
export function openedGenerationFixture(
  input: Pick<t.Dist.Generation.Open.Args, 'store'>,
  generation: t.Dist.Existing | t.Dist.Promoted = fakeGeneration(),
  release: () => Promise<void> = async () => {},
): t.Dist.Generation.Open.Success {
  const store = generationStoreFixture(input.store);
  const admittedGeneration = Object.freeze({
    ...generation,
    dir: Fs.join(store.dir, generation.integrity) as t.StringAbsoluteDir,
  }) as t.Dist.Existing | t.Dist.Promoted;
  const owner = generationOwnerFixture(store, release);
  return Object.freeze({ kind: 'opened', generation: admittedGeneration, owner });
}

/** Wrap one exact materialization failure as a released Generation-open settlement. */
export function failedGenerationFixture(
  generation: t.Dist.Failed,
  ownership: 'released' | 'pending' = 'released',
): t.Dist.Generation.Failure.Materialization {
  return Object.freeze({
    kind: 'failed',
    phase: 'materialization',
    generation,
    ownership,
  });
}

function generationStoreFixture(
  input: t.Dist.Generation.Store.Input,
): t.Dist.Generation.Store.Admitted {
  return Object.freeze({
    root: input.root as t.StringAbsoluteDir,
    target: input.target as t.StringRelativePath,
    dir: Fs.join(input.root, input.target) as t.StringAbsoluteDir,
  });
}

function generationOwnerFixture(
  store: t.Dist.Generation.Store.Admitted,
  release: () => Promise<void>,
): t.Dist.Generation.Owner {
  return Object.freeze({ store, release, [Symbol.asyncDispose]: release });
}

export function deferred(): PromiseWithResolvers<void> {
  return Promise.withResolvers<void>();
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
  return Object.freeze({
    addr: Object.freeze({ transport: 'tcp', hostname: '127.0.0.1', port: 1234 }),
    hostname: '127.0.0.1',
    port: 1234,
    origin,
    close,
    finished: input.finished ?? completion.promise,
    authority: Object.freeze({ kind: 'pinned', integrity: generation.integrity }),
    verification: generation.verification,
    browserPolicy: appliedBrowserPolicyFixture(origin),
  }) as Started;
}

export async function rejectionOf(action: () => Promise<unknown>): Promise<Error> {
  try {
    await action();
  } catch (cause) {
    return Is.error(cause) ? cause : new Error(String(cause));
  }
  throw new Error('Expected rejection.');
}

/** Remove a released test Dist store through lower owned-tree cleanup authority. */
export async function removeDistStore(storeDir: t.StringDir): Promise<void> {
  if (!(await Fs.exists(storeDir))) return;

  const parent = Fs.dirname(storeDir) as t.StringDir;
  const rooted = await Fs.Capability.Rooted.create({ root: parent });
  const admitted = await rooted.Target.admit([
    { path: Fs.basename(storeDir), kind: 'directory' },
  ]);
  const target = admitted.targets[0];
  const acquired = await rooted.Lease.acquire([target], {
    mode: 'exclusive',
    wait: true,
  });
  if (acquired.kind !== 'acquired') throw new Error('Dist test store is busy.');
  try {
    await rooted.Tree.remove(target, { lease: acquired.lease });
  } finally {
    await acquired.lease.release();
  }
}
