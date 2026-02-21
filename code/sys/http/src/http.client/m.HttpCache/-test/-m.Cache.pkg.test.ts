import { describe, expect, it } from '../../../-test.ts';
import {
  isSafeFullMediaCandidate,
  resolveMediaPolicy,
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
    expect(res).to.eql({ mode: 'safe-full' });
  });

  it('off mode bypasses media cache pipeline', () => {
    expect(shouldBypassMediaCache('off')).to.eql(true);
    expect(shouldBypassMediaCache('safe-full')).to.eql(false);
    expect(shouldBypassMediaCache('range-window')).to.eql(false);
  });
});
