import {
  type t,
  afterAll,
  beforeAll,
  describe,
  expect,
  expectTypeOf,
  it,
  makeWorkerFixture,
} from '../../-test.ts';

import { CrdtGraph } from '../mod.ts';
import { defaultDiscoverRefs } from '../u.defaultDiscoverRefs.ts';

describe(`Crdt.Graph`, () => {
  let env: t.TestWorkerFixture;
  beforeAll(async () => void (env = await makeWorkerFixture()));
  afterAll(() => env?.dispose());

  it('API', () => {
    expect(CrdtGraph.default.discoverRefs).to.equal(defaultDiscoverRefs);
  });

  it('walks a simple A → B → C DAG', async () => {
    const { repo } = env;

    /**
     * 1. Create documents A, B, C
     */
    const A = (await repo.create<{ next: string }>({ next: '' })).doc!;
    const B = (await repo.create<{ next: string }>({ next: '' })).doc!;
    const C = (await repo.create<{ value: number }>({ value: 123 })).doc!;

    // set links: A → B, B → C (default `crdt:` URI scheme)
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

      onDoc: ({ doc }) => {
        seenDocs.push(doc.id);
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

  it('walks a DAG using a custom discoverRefs hook (non-crdt scheme)', async () => {
    const { repo } = env;

    /**
     * 1. Create documents A, B, C
     *
     * Note: use a different scheme ("doc:") so the default CRDT-URI
     * discovery would not pick these up. Only the custom discoverRefs
     * hook will see them.
     */
    type T = { next: string };
    const A = (await repo.create<T>({ next: '' })).doc!;
    const B = (await repo.create<T>({ next: '' })).doc!;
    const C = (await repo.create<{ value: number }>({ value: 123 })).doc!;

    // set links: A → B, B → C using "doc:" scheme
    A.change((d) => (d.next = `doc:${B.id}`));
    B.change((d) => (d.next = `doc:${C.id}`));

    /**
     * 2. Capture callbacks + depth information
     */
    const seenDocs: t.Crdt.Id[] = [];
    const seenRefs: Record<t.Crdt.Id, readonly t.Crdt.Id[]> = {};
    const seenDepths: Record<t.Crdt.Id, number> = {};

    const discoverRefs: t.CrdtGraphDiscoverRefs = (args) => {
      const { doc, depth } = args;
      const current = doc.current as { next?: string };
      seenDepths[doc.id] = depth;

      const next = current.next;
      if (!next) return [];
      if (!next.startsWith('doc:')) return [];

      const id = next.slice('doc:'.length) as t.Crdt.Id;
      return [id];
    };

    const res = await CrdtGraph.walk({
      repo,
      id: A.id,
      onDoc: ({ doc }) => void seenDocs.push(doc.id),
      onRefs: ({ id, refs }) => (seenRefs[id] = refs),
      discoverRefs,
    });

    /**
     * 3. Assertions
     */

    // visited all 3 documents via the custom discoverRefs logic
    expect(res.processed).to.eql([A.id, B.id, C.id]);
    expect(seenDocs).to.eql([A.id, B.id, C.id]);

    // outbound edges as reported by the walker
    expect(seenRefs[A.id]).to.eql([B.id]);
    expect(seenRefs[B.id]).to.eql([C.id]);
    expect(seenRefs[C.id] || []).to.eql([]);

    // depth is correctly threaded through discoverRefs
    expect(seenDepths[A.id]).to.equal(0);
    expect(seenDepths[B.id]).to.equal(1);
    expect(seenDepths[C.id]).to.equal(2);

    // compile-time signature still holds
    expectTypeOf(res.processed).toEqualTypeOf<readonly t.Crdt.Id[]>();
  });

  it('supports an async discoverRefs hook', async () => {
    const { repo } = env;

    /**
     * 1. Create a simple A → B chain with "doc:" scheme again.
     */
    type T = { next?: string };
    const A = (await repo.create<T>({ next: '' })).doc!;
    const B = (await repo.create<{ value: number }>({ value: 123 })).doc!;

    A.change((d) => (d.next = `doc:${B.id}`));

    const seenDocs: t.Crdt.Id[] = [];

    const discoverRefs: t.CrdtGraphDiscoverRefs = async (args): Promise<readonly t.Crdt.Id[]> => {
      const doc = args.doc as t.Crdt.Ref<T>;
      const current = doc.current;
      const next = current.next;
      if (!next || !next.startsWith('doc:')) return [];
      const id = next.slice('doc:'.length) as t.Crdt.Id;
      return [id];
    };

    const res = await CrdtGraph.walk({
      repo,
      id: A.id,

      onDoc: ({ doc }) => {
        seenDocs.push(doc.id);
      },

      discoverRefs,
    });

    // visited both docs via async discoverRefs
    expect(res.processed).to.eql([A.id, B.id]);
    expect(seenDocs).to.eql([A.id, B.id]);
    expectTypeOf(res.processed).toEqualTypeOf<readonly t.Crdt.Id[]>();
  });

  it('walks a DAG via loader-only args (no repo on walk args)', async () => {
    const { repo } = env;

    /**
     * 1. Create documents A, B, C as a simple A → B → C chain.
     */
    type T = { next?: string };
    const A = (await repo.create<T>({ next: '' })).doc!;
    const B = (await repo.create<T>({ next: '' })).doc!;
    const C = (await repo.create<{ value: number }>({ value: 123 })).doc!;

    A.change((d) => (d.next = `crdt:${B.id}`));
    B.change((d) => (d.next = `crdt:${C.id}`));

    /**
     * 2. Implement a loader that mimics the remote/daemon path.
     *
     * In production this would usually be `cmd.send('doc:current', { id })`,
     * but here we simulate it in-process using `repo.get` so we can keep
     * the worker fixture and focus on the CrdtGraph surface.
     */
    const load = async (id: t.Crdt.Id): Promise<t.Crdt.Ref | undefined> => {
      const res = await repo.get(id);
      return res.doc ?? undefined;
    };

    const seenDocs: t.Crdt.Id[] = [];
    const seenRefs: Record<t.Crdt.Id, readonly t.Crdt.Id[]> = {};

    const res = await CrdtGraph.walk({
      load,
      id: A.id,

      onDoc: ({ doc }) => {
        seenDocs.push(doc.id);
      },

      onRefs: ({ id, refs }) => {
        seenRefs[id] = refs;
      },
    });

    /**
     * 3. Assertions
     *
     * Behaviour should match the repo-backed walk:
     * same processed order, same edge structure.
     */
    expect(res.processed).to.eql([A.id, B.id, C.id]);
    expect(seenDocs).to.eql([A.id, B.id, C.id]);

    expect(seenRefs[A.id]).to.eql([B.id]);
    expect(seenRefs[B.id]).to.eql([C.id]);
    expect(seenRefs[C.id] || []).to.eql([]);

    // still the same compile-time shape for processed ids
    expectTypeOf(res.processed).toEqualTypeOf<readonly t.Crdt.Id[]>();
  });
});
