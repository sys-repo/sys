import { describe, expect, Hash, it, Rx, type t } from '../../-test.ts';
import { Pinned } from '../../-exports/-pkg.dist.verify.ts';
import { manifestFixture } from './-u.manifest.fixture.ts';

function admit(input: unknown): Promise<t.Pkg.Dist.Pinned.AdmitManifest.Result> {
  return Pinned.admitManifest(input as t.Pkg.Dist.Pinned.AdmitManifest.Args);
}

describe('Pkg.Dist.Pinned.admitManifest input ownership', () => {
  it('rejects invalid shapes, checksum syntax, and non-finite or unsafe limits', async () => {
    const { bytes, integrity, limits } = await manifestFixture();
    const valid = { bytes, integrity, limits };
    const inputs: unknown[] = [
      null,
      [],
      {},
      Object.create(valid),
      { ...valid, dir: '/not-an-input' },
      { ...valid, [Symbol('extra')]: true },
      { ...valid, bytes: [1, 2] },
      { ...valid, bytes: new Uint16Array([1]) },
      { ...valid, bytes: { [Symbol.toStringTag]: 'Uint8Array' } },
      { ...valid, integrity: `${integrity}:size=0` },
      { ...valid, integrity: `${integrity}\n` },
      { ...valid, until: {} },
      { ...valid, limits: { ...limits, extra: 1 } },
    ];
    for (const key of ['manifestBytes', 'entries', 'fileBytes', 'totalBytes'] as const) {
      for (const value of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '4']) {
        inputs.push({ ...valid, limits: { ...limits, [key]: value } });
      }
    }
    inputs.push({ ...valid, limits: { ...limits, manifestBytes: 0 } });
    inputs.push({ ...valid, limits: { ...limits, entries: 0 } });
    for (const input of inputs) expect(await admit(input)).to.eql({ kind: 'invalid-input' });
  });

  it('does not invoke accessors or Proxy traps in data inputs', async () => {
    const { bytes, integrity, limits } = await manifestFixture();
    const valid = { bytes, integrity, limits };
    let calls = 0;
    const trap = () => {
      calls++;
      throw new Error('Unexpected caller code.');
    };
    const proxy = <T extends object>(input: T) => {
      return new Proxy(input, {
        get: trap,
        getPrototypeOf: trap,
        getOwnPropertyDescriptor: trap,
        ownKeys: trap,
      });
    };
    const inputs: unknown[] = [
      proxy(valid),
      { ...valid, bytes: proxy(bytes) },
      { ...valid, limits: proxy(limits) },
      { ...valid, until: proxy([]) },
    ];
    for (const key of ['bytes', 'integrity', 'limits', 'until']) {
      inputs.push(Object.defineProperty({ ...valid }, key, { get: trap }));
    }
    for (const key of ['manifestBytes', 'entries', 'fileBytes', 'totalBytes']) {
      inputs.push({ ...valid, limits: Object.defineProperty({ ...limits }, key, { get: trap }) });
    }
    inputs.push({ ...valid, until: Object.defineProperty([], '0', { get: trap }) });
    const revoked = Proxy.revocable(valid, {});
    revoked.revoke();
    inputs.push(revoked.proxy);
    for (const input of inputs) expect(await admit(input)).to.eql({ kind: 'invalid-input' });
    expect(calls).to.eql(0);
  });

  it('uses native byte length and copy without caller property, iterator, or species hooks', async () => {
    const { bytes, integrity, limits } = await manifestFixture();
    let calls = 0;
    const trap = () => {
      calls++;
      throw new Error('Unexpected byte hook.');
    };
    const padded = new Uint8Array(bytes.byteLength + 10);
    padded.set(bytes, 5);
    const view = padded.subarray(5, 5 + bytes.byteLength);
    for (const key of ['byteLength', 'buffer', 'constructor', Symbol.iterator]) {
      Object.defineProperty(view, key, { get: trap });
    }
    expect((await admit({ bytes: view, integrity, limits })).kind).to.eql('manifest-admitted');
    expect(await admit({ bytes: view, integrity, limits: { ...limits, manifestBytes: 1 } }))
      .to.eql({ kind: 'limit-exceeded' });
    expect(calls).to.eql(0);
  });

  it('refuses shared and detached storage but admits a captured resizable view', async () => {
    const { bytes, integrity, limits } = await manifestFixture();
    const shared = new Uint8Array(new SharedArrayBuffer(bytes.byteLength));
    shared.set(bytes);
    expect(await admit({ bytes: shared, integrity, limits })).to.eql({ kind: 'invalid-input' });
    const detached = new Uint8Array(bytes);
    structuredClone(detached.buffer, { transfer: [detached.buffer] });
    expect(await admit({ bytes: detached, integrity, limits })).to.eql({ kind: 'invalid-input' });

    const buffer = new ArrayBuffer(bytes.byteLength, { maxByteLength: bytes.byteLength * 2 });
    const view = new Uint8Array(buffer);
    view.set(bytes);
    const pending = admit({ bytes: view, integrity, limits });
    buffer.resize(0);
    expect((await pending).kind).to.eql('manifest-admitted');
  });

  it('retains expectation, limits, bytes, and lifecycle array membership before yielding', async () => {
    const { bytes, integrity, limits, dist } = await manifestFixture();
    const controller = new AbortController();
    const replacement = new AbortController();
    replacement.abort();
    const until = [controller.signal];
    const input = { bytes, integrity, limits, until };
    const pending = admit(input);
    bytes.fill(0);
    input.bytes = new Uint8Array();
    input.integrity = Hash.sha256('retarget');
    limits.entries = 1;
    until[0] = replacement.signal;
    const result = await pending;
    expect(result.kind).to.eql('manifest-admitted');
    if (result.kind !== 'manifest-admitted') throw new Error('Expected retained admission.');
    expect(result.evidence.integrity).to.eql(integrity);
    expect(result.evidence.dist).to.eql(dist);
  });

  it('captures bytes and expectation even before synchronous lifecycle getters run', async () => {
    const { bytes, integrity, limits } = await manifestFixture();
    const input = { bytes, integrity, limits };
    const life = Rx.lifecycle();
    let getters = 0;
    const until = {
      get disposed() {
        getters++;
        bytes.fill(0);
        input.integrity = Hash.sha256('retarget');
        limits.entries = 1;
        return life.disposed;
      },
      get dispose$() {
        return life.dispose$;
      },
    };
    try {
      const result = await admit({ ...input, until });
      expect(result.kind).to.eql('manifest-admitted');
      expect(getters).to.be.greaterThan(0);
      if (result.kind !== 'manifest-admitted') throw new Error('Expected retained admission.');
      expect(result.evidence.integrity).to.eql(integrity);
    } finally {
      life.dispose();
    }
  });

  it('observes cancellation before work, from ended lifecycles, and across asynchronous admission', async () => {
    const { bytes, integrity, limits } = await manifestFixture();
    const input = { bytes, integrity, limits };
    const before = new AbortController();
    before.abort('private-reason');
    expect(await admit({ ...input, until: before.signal })).to.eql({ kind: 'cancelled' });
    const life = Rx.lifecycle();
    life.dispose();
    expect(await admit({ ...input, until: [life] })).to.eql({ kind: 'cancelled' });

    const during = new AbortController();
    const pending = admit({ ...input, until: during.signal });
    await Promise.resolve(); // Enter the asynchronous ignore-policy admission boundary.
    during.abort('private-reason');
    expect(await pending).to.eql({ kind: 'cancelled' });
  });
});
