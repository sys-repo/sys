import { describe, expect, it } from '../../-test.ts';
import { CrdtIs } from '../mod.ts';
import { testRepo } from './-u.ts';

describe('Crdt.Is', { sanitizeResources: false, sanitizeOps: false }, () => {
  type T = { count: number };
  const Is = CrdtIs;
  const repo = testRepo();

  it('Is.repo', () => {
    // Positive: real repo instance from test helper.
    expect(Is.repo(repo)).to.be.true;

    // Negatives: primitives, nullish, and structural near-misses.
    const NON = [
      undefined,
      null,
      '',
      123,
      true,
      {},
      [],
      { id: 'x' },
      { sync: {} },
      { id: 'x', sync: {}, stores: [] },
      { id: 'x', sync: {}, stores: [], events: () => {} },
      {
        id: 'x',
        sync: {},
        stores: [],
        events: () => {},
        whenReady: () => Promise.resolve(),
        // missing create/get/delete
      },
    ];

    NON.forEach((value: any) => expect(Is.repo(value)).to.be.false);
  });

  it('Is.ref', async () => {
    const { doc } = await repo.create<T>({ count: 0 });
    expect(Is.ref(doc)).to.be.true;

    const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
    NON.forEach((value: any) => expect(Is.ref(value)).to.be.false);
  });

  it('Is.id', async () => {
    const { doc, error } = await repo.create<T>({ count: 0 });
    if (error) throw error;

    expect(Is.id(doc.id)).to.be.true;
    expect(Is.id(String(doc.id))).to.be.true;

    const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
    NON.forEach((value: any) => expect(Is.id(value)).to.be.false);
  });

  it('Is.proxy (worker shims branded via "worker-proxy")', () => {
    const proxyLike = { via: 'worker-proxy' as const };
    const proxyExtended = {
      via: 'worker-proxy' as const,
      status: { ready: true, busy: false },
    };

    // Structural positives.
    expect(Is.proxy(proxyLike)).to.be.true;
    expect(Is.proxy(proxyExtended)).to.be.true;

    // Negatives: wrong brand, missing brand, non-object, etc.
    const NON = [
      undefined,
      null,
      '',
      123,
      true,
      {},
      [],
      { via: 'local' },
      { via: 'WORKER-PROXY' },
      { via: 42 },
    ];

    NON.forEach((value: any) => expect(Is.proxy(value)).to.be.false);
  });
});
