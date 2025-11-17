import { describe, expect, it } from '../../-test.ts';
import { CrdtIs } from '../mod.ts';
import { testRepo } from './-u.ts';

describe('Crdt.Is', { sanitizeResources: false, sanitizeOps: false }, () => {
  type T = { count: number };
  const repo = testRepo();
  const Is = CrdtIs;

  it('Is.ref', () => {
    const doc = repo.create<T>({ count: 0 });
    expect(Is.ref(doc)).to.be.true;

    const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
    NON.forEach((value: any) => expect(Is.ref(value)).to.be.false);
  });

  it('Is.id', () => {
    const doc = repo.create<T>({ count: 0 });
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
