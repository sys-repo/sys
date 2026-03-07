import { type t, describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Immutable } from '../../m.rfc6902/mod.ts';
import { Graph } from '../mod.ts';

describe(`Graph.walk`, () => {
  it('walks a simple A → B → C DAG via custom discoverRefs (id: scheme)', async () => {
    type Node = { next?: string; value?: number };

    const A: t.StringId = 'A';
    const B: t.StringId = 'B';
    const C: t.StringId = 'C';

    const docs = new Map<t.StringId, t.ImmutableSnapshot<Node>>();

    const add = (id: t.StringId, value: Node) => {
      const ref = Immutable.clonerRef<Node>(value);
      const snapshot: t.ImmutableSnapshot<Node> = { current: ref.current };
      docs.set(id, snapshot);
    };

    // A → B → C using "id:" scheme in the `next` field.
    add(A, { next: `id:${B}` });
    add(B, { next: `id:${C}` });
    add(C, { value: 123 });

    const load: t.Graph.LoadDoc<Node> = async (id) => docs.get(id);

    const seenDocs: t.StringId[] = [];
    const seenRefs: Record<t.StringId, readonly t.StringId[]> = {};

    const discoverRefs: t.Graph.DiscoverRefs = ({ doc }) => {
      const current = doc.current as Node;
      const next = current.next;
      if (!next || !next.startsWith('id:')) return [];
      const id = next.slice('id:'.length) as t.StringId;
      return [id];
    };

    const res = await Graph.walk<Node>({
      id: A,
      load,
      discoverRefs,

      onDoc: ({ id }) => {
        seenDocs.push(id);
      },

      onRefs: ({ id, refs }) => {
        seenRefs[id] = refs;
      },
    });

    // visited all 3 documents
    expect(res.processed).to.eql([A, B, C]);
    expect(seenDocs).to.eql([A, B, C]);

    // outbound edges (string → string[])
    expect(seenRefs[A]).to.eql([B]);
    expect(seenRefs[B]).to.eql([C]);
    expect(seenRefs[C] || []).to.eql([]);

    // compile-time signature
    expectTypeOf(res.processed).toEqualTypeOf<readonly t.StringId[]>();
  });

  it('walks a DAG using a custom discoverRefs hook (alt scheme with depth tracking)', async () => {
    type Node = { next?: string; value?: number };

    const A: t.StringId = 'A';
    const B: t.StringId = 'B';
    const C: t.StringId = 'C';

    const docs = new Map<t.StringId, t.ImmutableSnapshot<Node>>();

    const add = (id: t.StringId, value: Node) => {
      const ref = Immutable.clonerRef<Node>(value);
      const snapshot: t.ImmutableSnapshot<Node> = { current: ref.current };
      docs.set(id, snapshot);
    };

    // A → B → C using "node:" scheme
    add(A, { next: `node:${B}` });
    add(B, { next: `node:${C}` });
    add(C, { value: 123 });

    const load: t.Graph.LoadDoc<Node> = async (id) => docs.get(id);

    const seenDocs: t.StringId[] = [];
    const seenRefs: Record<t.StringId, readonly t.StringId[]> = {};
    const seenDepths: Record<t.StringId, number> = {};

    const discoverRefs: t.Graph.DiscoverRefs = ({ id, doc, depth }) => {
      const current = doc.current as Node;
      seenDepths[id] = depth;

      const next = current.next;
      if (!next || !next.startsWith('node:')) return [];

      const nextId = next.slice('node:'.length) as t.StringId;
      return [nextId];
    };

    const res = await Graph.walk<Node>({
      id: A,
      load,
      onDoc: ({ id }) => void seenDocs.push(id),
      onRefs: ({ id, refs }) => (seenRefs[id] = refs),
      discoverRefs,
    });

    // visited all 3 documents via the custom discoverRefs logic
    expect(res.processed).to.eql([A, B, C]);
    expect(seenDocs).to.eql([A, B, C]);

    // outbound edges as reported by the walker
    expect(seenRefs[A]).to.eql([B]);
    expect(seenRefs[B]).to.eql([C]);
    expect(seenRefs[C] || []).to.eql([]);

    // depth is correctly threaded through discoverRefs
    expect(seenDepths[A]).to.equal(0);
    expect(seenDepths[B]).to.equal(1);
    expect(seenDepths[C]).to.equal(2);

    // compile-time signature still holds
    expectTypeOf(res.processed).toEqualTypeOf<readonly t.StringId[]>();
  });

  it('supports an async discoverRefs hook', async () => {
    type Node = { next?: string; value?: number };

    const A: t.StringId = 'A';
    const B: t.StringId = 'B';

    const docs = new Map<t.StringId, t.ImmutableSnapshot<Node>>();

    const add = (id: t.StringId, value: Node) => {
      const ref = Immutable.clonerRef<Node>(value);
      const snapshot: t.ImmutableSnapshot<Node> = { current: ref.current };
      docs.set(id, snapshot);
    };

    // A → B using "node:" scheme
    add(A, { next: `node:${B}` });
    add(B, { value: 123 });

    const load: t.Graph.LoadDoc<Node> = async (id) => docs.get(id);

    const seenDocs: t.StringId[] = [];

    const discoverRefs: t.Graph.DiscoverRefs = async ({ doc }): Promise<readonly t.StringId[]> => {
      const current = doc.current as Node;
      const next = current.next;
      if (!next || !next.startsWith('node:')) return [];
      const id = next.slice('node:'.length) as t.StringId;
      return [id];
    };

    const res = await Graph.walk<Node>({
      id: A,
      load,
      discoverRefs,
      onDoc: ({ id }) => {
        seenDocs.push(id);
      },
    });

    // visited both docs via async discoverRefs
    expect(res.processed).to.eql([A, B]);
    expect(seenDocs).to.eql([A, B]);
    expectTypeOf(res.processed).toEqualTypeOf<readonly t.StringId[]>();
  });
});
