import {
  type t,
  afterAll,
  beforeAll,
  describe,
  expect,
  expectTypeOf,
  it,
  spawnTestWorker,
} from '../../-test.ts';

import { CrdtGraph } from '../mod.ts';

describe(`Crdt.Graph`, () => {
  let env: t.TestWorkerEnv;
  beforeAll(async () => void (env = await spawnTestWorker()));
  afterAll(() => env?.dispose());

  it('walks a simple A → B → C DAG', async () => {
    const { repo } = env;

    /**
     * 1. Create documents A, B, C
     */
    const A = (await repo.create<{ next: string }>({ next: '' })).doc!;
    const B = (await repo.create<{ next: string }>({ next: '' })).doc!;
    const C = (await repo.create<{ value: number }>({ value: 123 })).doc!;

    // set links: A → B, B → C
    A.change((d) => (d.next = `crdt:${B.id}`));
    B.change((d) => (d.next = `crdt:${C.id}`));

    /**
     * 2. Capture walker callbacks
     */
    const seenDocs: t.Crdt.Id[] = [];
    const seenRefs: Record<t.Crdt.Id, readonly t.Crdt.Id[]> = {};

    const res = await CrdtGraph.walk({
      repo,
      id: A.id,

      onDoc: ({ id }) => {
        seenDocs.push(id);
      },

      onRefs: ({ id, refs }) => {
        seenRefs[id] = refs;
      },
    });

    /**
     * 3. Assertions
     */

    // visited all 3 documents
    expect(res.processed).to.eql([A.id, B.id, C.id]);
    expect(seenDocs).to.eql([A.id, B.id, C.id]);

    // outbound edges (string → string[])
    expect(seenRefs[A.id]).to.eql([B.id]);
    expect(seenRefs[B.id]).to.eql([C.id]);
    expect(seenRefs[C.id] || []).to.eql([]);

    // compile-time signature
    expectTypeOf(res.processed).toEqualTypeOf<readonly t.Crdt.Id[]>();
  });
});
