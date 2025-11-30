import { type t, c, describe, expect, expectTypeOf, it } from '../../-test.ts';
import { Immutable } from '../../m.rfc6902/mod.ts';
import { Graph } from '../mod.ts';

describe(`Graph.dag`, () => {
  it('materializes a simple A → B → C DAG', async () => {
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

    const discoverRefs: t.Graph.DiscoverRefs = ({ doc }) => {
      const current = doc.current as Node;
      const next = current.next;
      if (!next || !next.startsWith('id:')) return [];
      const id = next.slice('id:'.length) as t.StringId;
      return [id];
    };

    const res = await Graph.dag<Node>({
      id: A,
      load,
      discoverRefs,
    });

    const getNode = (id: t.StringId) => res.nodes.find((n) => n.id === id)!;

    // root + processed
    expect(res.root).to.eql(A);
    expect(res.processed).to.eql([A, B, C]);

    // nodes
    const nodeA = getNode(A);
    const nodeB = getNode(B);
    const nodeC = getNode(C);

    expect(nodeA.depth).to.eql(0);
    expect(nodeB.depth).to.eql(1);
    expect(nodeC.depth).to.eql(2);

    expect(nodeA.refs).to.eql([B]);
    expect(nodeB.refs).to.eql([C]);
    expect(nodeC.refs).to.eql([]);

    // edges
    expect(res.edges).to.eql([
      { from: A, to: B },
      { from: B, to: C },
    ]);

    // compile-time shape
    expectTypeOf(res.nodes).toEqualTypeOf<readonly t.Graph.Dag.Node<Node>[]>();

    console.info();
    console.info(c.cyan('DAG: Directed Acyclic Graph'));
    console.info(c.gray('A → B → C'));
    console.info();
    console.info(res);
    console.info();
  });

  it('optionally includes skipped nodes (not-found / not-object)', async () => {
    type Node = { next?: string; alt?: string; label?: string };

    const A: t.StringId = 'A';
    const B: t.StringId = 'B';
    const D: t.StringId = 'D';
    const MISSING: t.StringId = 'MISSING';

    const docs = new Map<t.StringId, t.ImmutableSnapshot<Node>>();

    const addNode = (id: t.StringId, value: Node) => {
      const ref = Immutable.clonerRef<Node>(value);
      const snapshot: t.ImmutableSnapshot<Node> = { current: ref.current };
      docs.set(id, snapshot);
    };

    // A → B and A → D, B → MISSING
    addNode(A, { label: 'A', next: `node:${B}`, alt: `node:${D}` });
    addNode(B, { label: 'B', next: `node:${MISSING}` });

    // D exists but is a non-object payload (forces "not-object").
    const snapshotD: t.ImmutableSnapshot<Node> = {
      current: 42 as unknown as Node,
    };
    docs.set(D, snapshotD);

    // MISSING is not added at all (forces "not-found").

    const load: t.Graph.LoadDoc<Node> = async (id) => docs.get(id);

    const discoverRefs: t.Graph.DiscoverRefs = ({ doc }) => {
      const current = doc.current as Node;
      const out: t.StringId[] = [];

      const next = current.next;
      if (next && next.startsWith('node:')) {
        out.push(next.slice('node:'.length) as t.StringId);
      }

      const alt = current.alt;
      if (alt && alt.startsWith('node:')) {
        out.push(alt.slice('node:'.length) as t.StringId);
      }

      return out;
    };

    const baseArgs = { id: A, load, discoverRefs };

    const withoutSkipped = await Graph.dag<Node>(baseArgs);
    const withSkipped = await Graph.dag<Node>({ ...baseArgs, includeSkipped: true });

    // Without skipped nodes: only successfully processed docs (A, B).
    const idsWithout = withoutSkipped.nodes.map((n) => n.id).sort();
    expect(idsWithout).to.eql([A, B].sort());
    expect(withoutSkipped.processed).to.eql([A, B]);

    // With skipped nodes: also includes D ("not-object") and MISSING ("not-found").
    const idsWith = withSkipped.nodes.map((n) => n.id);
    const nodeA = withSkipped.nodes.find((n) => n.id === A)!;
    const nodeB = withSkipped.nodes.find((n) => n.id === B)!;
    const nodeD = withSkipped.nodes.find((n) => n.id === D)!;
    const nodeMissing = withSkipped.nodes.find((n) => n.id === MISSING)!;

    expect(idsWith).to.include(A);
    expect(idsWith).to.include(B);
    expect(idsWith).to.include(D);
    expect(idsWith).to.include(MISSING);

    // depths (shortest paths preserved)
    expect(nodeA.depth).to.eql(0);
    expect(nodeB.depth).to.eql(1);
    expect(nodeD.depth).to.eql(1);
    expect(nodeMissing.depth).to.eql(2);

    // reasons on skipped nodes
    expect(nodeD.reason).to.eql('not-object');
    expect(nodeMissing.reason).to.eql('not-found');

    // edges are materialized regardless of includeSkipped
    expect(withSkipped.edges).to.eql([
      { from: A, to: B },
      { from: A, to: D },
      { from: B, to: MISSING },
    ]);

    // compile-time shape still holds
    expectTypeOf(withSkipped.nodes).toEqualTypeOf<readonly t.Graph.Dag.Node<Node>[]>();
  });

  it('forwards user hooks while building the DAG', async () => {
    type Node = { next?: string; label?: string };

    const A: t.StringId = 'A';
    const B: t.StringId = 'B';
    const MISSING: t.StringId = 'MISSING';

    const docs = new Map<t.StringId, t.ImmutableSnapshot<Node>>();

    const addNode = (id: t.StringId, value: Node) => {
      const ref = Immutable.clonerRef<Node>(value);
      const snapshot: t.ImmutableSnapshot<Node> = { current: ref.current };
      docs.set(id, snapshot);
    };

    // A → B → MISSING
    addNode(A, { label: 'A', next: `node:${B}` });
    addNode(B, { label: 'B', next: `node:${MISSING}` });

    const load: t.Graph.LoadDoc<Node> = async (id) => docs.get(id);

    const discoverRefs: t.Graph.DiscoverRefs = ({ doc }) => {
      const current = doc.current as Node;
      const next = current.next;
      if (!next || !next.startsWith('node:')) return [];
      return [next.slice('node:'.length) as t.StringId];
    };

    const seenDocs: t.StringId[] = [];
    const seenRefs: Record<t.StringId, readonly t.StringId[]> = {};
    const skips: t.Graph.WalkSkipArgs[] = [];

    const res = await Graph.dag<Node>({
      id: A,
      load,
      discoverRefs,
      includeSkipped: true,

      onDoc: ({ id }) => {
        seenDocs.push(id);
      },

      onRefs: ({ id, refs }) => {
        seenRefs[id] = refs;
      },

      onSkip: (e) => {
        skips.push(e);
      },
    });

    // DAG structure still correct.
    expect(res.root).to.eql(A);
    expect(res.processed).to.eql([A, B]);

    const ids = res.nodes.map((n) => n.id);
    expect(ids).to.include(A);
    expect(ids).to.include(B);
    expect(ids).to.include(MISSING);

    const nodeA = res.nodes.find((n) => n.id === A)!;
    const nodeB = res.nodes.find((n) => n.id === B)!;
    const nodeMissing = res.nodes.find((n) => n.id === MISSING)!;

    expect(nodeA.refs).to.eql([B]);
    expect(nodeB.refs).to.eql([MISSING]);
    expect(nodeMissing.refs).to.eql([]);

    // User hooks see the same traversal.
    expect(seenDocs).to.eql([A, B]);
    expect(seenRefs[A]).to.eql([B]);
    expect(seenRefs[B]).to.eql([MISSING]);

    // Skip hook fired for the missing node.
    const missingSkip = skips.find((e) => e.id === MISSING)!;
    expect(missingSkip.reason).to.eql('not-found');

    // Type shape still good.
    expectTypeOf(res.nodes).toEqualTypeOf<readonly t.Graph.Dag.Node<Node>[]>();
  });
});
