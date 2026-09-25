import { describe, expect, it } from '../../../-test.ts';
import {
  isCacheableHashedAssetResponse,
  isRangeWindowCacheCandidate,
  isSafeFullMediaCandidate,
  pkg as startPkgCache,
  resolveMediaPolicy,
  shouldBypassMediaCache,
  shouldUseRangeCacheEntry,
} from '../m.Cache.pkg.ts';
import { PkgCache } from '../u.pkg.names.ts';

describe('Http.Cache.Pkg', () => {
  it('snapshots one frozen delimiter-bound namespace with the current cache names', () => {
    const descriptor = { name: 'my-pkg', version: '1.0.0' };
    const names = PkgCache.names(descriptor);
    descriptor.name = 'changed';

    expect(Object.isFrozen(PkgCache)).to.eql(true);
    expect(Object.isFrozen(names)).to.eql(true);
    expect(Object.isFrozen(names.current)).to.eql(true);
    expect(names.prefix).to.eql('my-pkg:');
    expect(names.current).to.eql([
      'my-pkg:asset-files',
      'my-pkg:media-files',
      'my-pkg:media-range-files',
    ]);
    expect([names.asset, names.media, names.mediaRange]).to.eql(names.current);
  });

  it('owns only the exact delimiter-bound package namespace', () => {
    const names = PkgCache.names({ name: 'my-pkg', version: '1.0.0' });

    expect(names.isOwned('my-pkg:obsolete')).to.eql(true);
    expect(names.isOwned('my-pkg:asset-files:v0')).to.eql(true);
    expect(names.isOwned('my-pkg')).to.eql(false);
    expect(names.isOwned('my-pkg-legacy:obsolete')).to.eql(false);
    expect(names.isOwned('my-pkg2:obsolete')).to.eql(false);
    expect(names.isOwned('other:my-pkg:obsolete')).to.eql(false);
    expect(names.current.map(names.isCurrent)).to.eql([true, true, true]);
    expect(names.isCurrent('my-pkg:obsolete')).to.eql(false);
  });
});

describe('Http.Cache.pkg activation ownership', () => {
  it('claims clients and deletes only owned non-current cache names', async () => {
    const fixture = await pkgWorkerFixture({
      names: [
        'my-pkg:asset-files',
        'my-pkg:media-files',
        'my-pkg:media-range-files',
        'my-pkg:obsolete',
        'my-pkg:asset-files:v0',
        'my-pkg-legacy:obsolete',
        'my-pkg2:obsolete',
        'other:cache',
      ],
    });

    try {
      await fixture.activate();

      expect(fixture.deleted).to.eql(['my-pkg:obsolete', 'my-pkg:asset-files:v0']);
      expect(fixture.calls).to.eql([
        'skipWaiting',
        'claim',
        'waitUntil',
        'keys',
        'delete:my-pkg:obsolete',
        'delete:my-pkg:asset-files:v0',
      ]);
      expect(fixture.listeners.has('fetch')).to.eql(true);
    } finally {
      fixture.restore();
    }
  });

  it('propagates client-claim rejection through waitUntil', async () => {
    const failure = new Error('claim-failure');
    const fixture = await pkgWorkerFixture({
      claim: async () => {
        throw failure;
      },
    });

    try {
      await expectSameFailure(() => fixture.activate(), failure);
      expect(fixture.calls).to.eql(['skipWaiting', 'claim', 'waitUntil']);
    } finally {
      fixture.restore();
    }
  });

  it('propagates cache enumeration rejection through waitUntil', async () => {
    const failure = new Error('keys-failure');
    const fixture = await pkgWorkerFixture({
      keys: async () => {
        throw failure;
      },
    });

    try {
      await expectSameFailure(() => fixture.activate(), failure);
      expect(fixture.calls).to.eql(['skipWaiting', 'claim', 'waitUntil', 'keys']);
    } finally {
      fixture.restore();
    }
  });

  it('propagates owned-cache deletion rejection through waitUntil', async () => {
    const failure = new Error('delete-failure');
    const fixture = await pkgWorkerFixture({
      names: ['other:cache', 'my-pkg:obsolete'],
      remove: async () => {
        throw failure;
      },
    });

    try {
      await expectSameFailure(() => fixture.activate(), failure);
      expect(fixture.calls).to.eql([
        'skipWaiting',
        'claim',
        'waitUntil',
        'keys',
        'delete:my-pkg:obsolete',
      ]);
    } finally {
      fixture.restore();
    }
  });
});

describe('Http.Cache.pkg safety guards', () => {
  it('rejects html fallback responses for hashed assets', () => {
    const res = isCacheableHashedAssetResponse(
      new Response('<!doctype html><html></html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }),
    );
    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.reason).to.eql('content-type:text/html');
  });

  it('accepts javascript responses for hashed assets', () => {
    const res = isCacheableHashedAssetResponse(
      new Response('console.log("ok")', {
        status: 200,
        headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
      }),
    );
    expect(res).to.eql({ ok: true });
  });

  it('accepts a valid full 200 response candidate', () => {
    const res = isSafeFullMediaCandidate({
      status: 200,
      bodySize: 1024,
      contentLength: 1024,
    });
    expect(res).to.eql({ ok: true });
  });

  it('rejects non-200 candidates (eg: 206)', () => {
    const res = isSafeFullMediaCandidate({
      status: 206,
      bodySize: 1024,
      contentLength: 1024,
    });
    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.reason).to.eql('status:206');
  });

  it('rejects empty body candidates', () => {
    const res = isSafeFullMediaCandidate({
      status: 200,
      bodySize: 0,
      contentLength: 0,
    });
    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.reason).to.eql('empty-body');
  });

  it('rejects content-length mismatch', () => {
    const res = isSafeFullMediaCandidate({
      status: 200,
      bodySize: 1000,
      contentLength: 999,
    });
    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.reason).to.eql('length-mismatch:999!=1000');
  });

  it('rejects partial content-range spans', () => {
    const res = isSafeFullMediaCandidate({
      status: 200,
      bodySize: 1000,
      contentLength: 1000,
      contentRange: 'bytes 500-999/1000',
    });
    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.reason).to.eql('partial-content-range');
  });

  it('accepts full-span content-range values', () => {
    const res = isSafeFullMediaCandidate({
      status: 200,
      bodySize: 1000,
      contentLength: 1000,
      contentRange: 'bytes 0-999/1000',
    });
    expect(res).to.eql({ ok: true });
  });
});

describe('Http.Cache.pkg policy routing', () => {
  it('defaults media policy mode to safe-full', () => {
    const res = resolveMediaPolicy(undefined);
    expect(res.mode).to.eql('safe-full');
    expect(res.maxChunkBytes > 0).to.eql(true);
    expect(res.maxObjectBytes > 0).to.eql(true);
    expect(res.maxTotalBytes > 0).to.eql(true);
    expect(res.ttl > 0).to.eql(true);
  });

  it('off mode bypasses media cache pipeline', () => {
    expect(shouldBypassMediaCache('off')).to.eql(true);
    expect(shouldBypassMediaCache('safe-full')).to.eql(false);
    expect(shouldBypassMediaCache('range-window')).to.eql(false);
  });
});

describe('Http.Cache.pkg range-window guards', () => {
  const policy = resolveMediaPolicy({
    mode: 'range-window',
    maxChunkBytes: 1000,
    maxObjectBytes: 5000,
    maxTotalBytes: 10000,
    ttlMs: 1000,
  });

  it('accepts valid 206 candidate', () => {
    const res = isRangeWindowCacheCandidate({
      status: 206,
      request: { start: 0, end: 999 },
      contentRange: 'bytes 0-999/5000',
      policy,
    });
    expect(res.ok).to.eql(true);
  });

  it('rejects missing content-range header', () => {
    const res = isRangeWindowCacheCandidate({
      status: 206,
      request: { start: 0, end: 999 },
      contentRange: undefined,
      policy,
    });
    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.reason).to.eql('missing-content-range');
  });

  it('rejects malformed content-range header', () => {
    const res = isRangeWindowCacheCandidate({
      status: 206,
      request: { start: 0, end: 999 },
      contentRange: 'bytes nope',
      policy,
    });
    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.reason).to.eql('invalid-content-range');
  });

  it('rejects request/content-range start mismatch', () => {
    const res = isRangeWindowCacheCandidate({
      status: 206,
      request: { start: 100, end: 999 },
      contentRange: 'bytes 0-999/5000',
      policy,
    });
    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.reason).to.eql('range-start-mismatch');
  });

  it('rejects request/content-range end mismatch', () => {
    const res = isRangeWindowCacheCandidate({
      status: 206,
      request: { start: 0, end: 998 },
      contentRange: 'bytes 0-999/5000',
      policy,
    });
    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.reason).to.eql('range-end-mismatch');
  });

  it('rejects non-206 response', () => {
    const res = isRangeWindowCacheCandidate({
      status: 200,
      request: { start: 0, end: 999 },
      contentRange: 'bytes 0-999/5000',
      policy,
    });
    expect(res.ok).to.eql(false);
  });

  it('rejects when range exceeds chunk limit', () => {
    const res = isRangeWindowCacheCandidate({
      status: 206,
      request: { start: 0, end: 1500 },
      contentRange: 'bytes 0-1500/5000',
      policy,
    });
    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.reason).to.eql('chunk-too-large');
  });

  it('rejects when range chunk exceeds total cache budget', () => {
    const tinyTotalPolicy = resolveMediaPolicy({
      mode: 'range-window',
      maxChunkBytes: 2000,
      maxObjectBytes: 5000,
      maxTotalBytes: 500,
      ttlMs: 1000,
    });
    const res = isRangeWindowCacheCandidate({
      status: 206,
      request: { start: 0, end: 999 },
      contentRange: 'bytes 0-999/5000',
      policy: tinyTotalPolicy,
    });
    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.reason).to.eql('total-budget-too-small');
  });

  it('rejects when object exceeds object limit', () => {
    const res = isRangeWindowCacheCandidate({
      status: 206,
      request: { start: 0, end: 999 },
      contentRange: 'bytes 0-999/5001',
      policy,
    });
    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.reason).to.eql('object-too-large');
  });

  it('cached entry requires metadata', () => {
    const res = shouldUseRangeCacheEntry({ now: 1000 });
    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.reason).to.eql('missing-meta');
  });

  it('cached entry expires at ttl boundary', () => {
    const res = shouldUseRangeCacheEntry({
      now: 1000,
      meta: {
        createdAt: 100,
        lastAccessAt: 900,
        expiresAt: 1000,
        bytes: 100,
      },
    });
    expect(res.ok).to.eql(false);
    if (!res.ok) expect(res.reason).to.eql('expired');
  });

  it('cached entry with valid metadata can be served', () => {
    const res = shouldUseRangeCacheEntry({
      now: 999,
      meta: {
        createdAt: 100,
        lastAccessAt: 900,
        expiresAt: 1000,
        bytes: 100,
      },
    });
    expect(res).to.eql({ ok: true });
  });
});

describe('Http.Cache.pkg policy normalization', () => {
  it('normalizes invalid numeric inputs to defaults', () => {
    const res = resolveMediaPolicy({
      mode: 'range-window',
      maxChunkBytes: 0,
      maxObjectBytes: -1,
      maxTotalBytes: Number.NaN,
      ttlMs: -100,
    });
    expect(res.maxChunkBytes > 0).to.eql(true);
    expect(res.maxObjectBytes > 0).to.eql(true);
    expect(res.maxTotalBytes > 0).to.eql(true);
    expect(res.ttl > 0).to.eql(true);
  });
});

async function expectSameFailure(run: () => Promise<unknown>, failure: Error) {
  let actual: unknown;
  try {
    await run();
  } catch (error) {
    actual = error;
  }
  expect(actual).to.equal(failure);
}

type PkgWorkerFixtureOptions = {
  readonly names?: readonly string[];
  readonly claim?: () => Promise<void>;
  readonly keys?: () => Promise<string[]>;
  readonly remove?: (name: string) => Promise<boolean>;
};

async function pkgWorkerFixture(options: PkgWorkerFixtureOptions = {}) {
  const selfDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'self');
  const cachesDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'caches');
  if (!selfDescriptor || !cachesDescriptor) throw new Error('Missing service-worker test globals');

  const calls: string[] = [];
  const deleted: string[] = [];
  const listeners = new Map<string, (event: never) => void>();
  const worker = {
    skipWaiting() {
      calls.push('skipWaiting');
    },
    clients: {
      async claim() {
        calls.push('claim');
        await options.claim?.();
      },
    },
    addEventListener(type: string, listener: (event: never) => void) {
      listeners.set(type, listener);
    },
  };
  const storage = {
    async keys() {
      calls.push('keys');
      if (options.keys) return await options.keys();
      return [...(options.names ?? [])];
    },
    async delete(name: string) {
      calls.push(`delete:${name}`);
      deleted.push(name);
      if (options.remove) return await options.remove(name);
      return true;
    },
  };
  const restore = () => {
    Object.defineProperty(globalThis, 'self', selfDescriptor);
    Object.defineProperty(globalThis, 'caches', cachesDescriptor);
  };

  Object.defineProperty(globalThis, 'self', { value: worker, configurable: true });
  Object.defineProperty(globalThis, 'caches', { value: storage, configurable: true });

  try {
    await startPkgCache({ pkg: { name: 'my-pkg', version: '1.0.0' }, silent: true });
  } catch (error) {
    restore();
    throw error;
  }

  return {
    calls,
    deleted,
    listeners,
    restore,
    activate() {
      const listener = listeners.get('activate');
      if (!listener) throw new Error('Missing activate listener');

      let pending: Promise<unknown> | undefined;
      listener({
        waitUntil(value: Promise<unknown>) {
          calls.push('waitUntil');
          pending = value;
        },
      } as never);
      if (!pending) throw new Error('Activate listener did not call waitUntil');
      return pending;
    },
  };
}
