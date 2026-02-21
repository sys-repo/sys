import { describe, expect, it } from '../../../-test.ts';
import {
  isSafeFullMediaCandidate,
  isRangeWindowCacheCandidate,
  resolveMediaPolicy,
  shouldUseRangeCacheEntry,
  shouldBypassMediaCache,
} from '../m.Cache.pkg.ts';

describe('Http.Cache.pkg safety guards', () => {
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
    expect(res.ttlMs > 0).to.eql(true);
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
    expect(res.ttlMs > 0).to.eql(true);
  });
});
