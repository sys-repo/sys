import { type t, describe, expect, it } from '../../-test.ts';
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

  it('Is.uri', () => {
    // Use a known-good document id (must satisfy CrdtIs.id(validId) === true).
    const validId = 'pz1U8r3FH2ubPjnBzTMtFB8Yaaw' as t.DocumentId;
    const uri = `crdt:${validId}`;

    // happy path
    expect(CrdtIs.id(validId)).to.eql(true);
    expect(CrdtIs.uri(uri)).to.eql(true);

    // plain id is not a URI
    expect(CrdtIs.uri(validId)).to.eql(false);

    // wrong scheme
    expect(CrdtIs.uri(`foo:${validId}`)).to.eql(false);
    expect(CrdtIs.uri(`CRDT:${validId}`)).to.eql(false); // case-sensitive

    // malformed URIs
    expect(CrdtIs.uri('crdt:')).to.eql(false); // missing id
    expect(CrdtIs.uri('crdt: ')).to.eql(false); // space instead of id
    expect(CrdtIs.uri(`crdt:${validId}x`)).to.eql(false); // extra junk

    // non-strings
    expect(CrdtIs.uri(undefined)).to.eql(false);
    expect(CrdtIs.uri(null)).to.eql(false);
    expect(CrdtIs.uri(123)).to.eql(false);
    expect(CrdtIs.uri({ uri })).to.eql(false);
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
