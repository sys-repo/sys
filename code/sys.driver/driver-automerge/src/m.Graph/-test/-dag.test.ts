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

describe(`Crdt.Graph.dag`, () => {
  let env: t.TestWorkerFixture;
  beforeAll(async () => void (env = await makeWorkerFixture()));
  afterAll(() => env?.dispose());

  it('materializes a simple A → B → C DAG via repo + default discoverRefs', async () => {
    const { repo } = env;

    type T = { next?: string };

    // 1. Create A, B, C and link: A → B → C via "crdt:" URIs.
    const A = (await repo.create<T>({ next: '' })).doc!;
    const B = (await repo.create<T>({ next: '' })).doc!;
    const C = (await repo.create<{ value: number }>({ value: 123 })).doc!;

    A.change((d) => (d.next = `crdt:${B.id}`));
    B.change((d) => (d.next = `crdt:${C.id}`));

    // 2. Build DAG via repo-backed CrdtGraph.dag.
    const res = await CrdtGraph.Dag.build<T>({ repo, id: A.id });

    const getNode = (id: t.Crdt.Id) => res.nodes.find((n) => n.id === id)!;

    // Root + processed order mirrors the underlying walk.
    expect(res.root).to.eql(A.id);
    expect(res.processed).to.eql([A.id, B.id, C.id]);

    // Nodes
    const nodeA = getNode(A.id);
    const nodeB = getNode(B.id);
    const nodeC = getNode(C.id);

    expect(nodeA.depth).to.eql(0);
    expect(nodeB.depth).to.eql(1);
    expect(nodeC.depth).to.eql(2);

    expect(nodeA.refs).to.eql([B.id]);
    expect(nodeB.refs).to.eql([C.id]);
    expect(nodeC.refs).to.eql([]);

    // Edges
    expect(res.edges).to.eql([
      { from: A.id, to: B.id },
      { from: B.id, to: C.id },
    ]);

    // Compile-time shape: DAG nodes are the generic immutable DAG nodes.
    expectTypeOf(res.nodes).toEqualTypeOf<readonly t.Graph.Dag.Node<T>[]>();
  });

  it('supports loader-backed DAGs with a custom discoverRefs hook', async () => {
    const { repo } = env;

    type T = { next?: string };

    // 1. Create A, B, C and link via "doc:" scheme (non-CRDT URI).
    const A = (await repo.create<T>({ next: '' })).doc!;
    const B = (await repo.create<T>({ next: '' })).doc!;
    const C = (await repo.create<{ value: number }>({ value: 123 })).doc!;

    A.change((d) => (d.next = `doc:${B.id}`));
    B.change((d) => (d.next = `doc:${C.id}`));

    // 2. Loader that mimics a remote/daemon path (but uses repo.get in-process).
    const load = async (id: t.Crdt.Id): Promise<t.Crdt.Ref | undefined> => {
      const res = await repo.get(id);
      return res.doc ?? undefined;
    };

    // 3. Custom discoverRefs for the "doc:" scheme.
    const discoverRefs: t.Graph.DiscoverRefs = ({ doc }) => {
      const current = doc.current as T;
      const next = current.next;
      if (!next || !next.startsWith('doc:')) return [];
      const nextId = next.slice('doc:'.length) as t.Crdt.Id;
      return [nextId];
    };

    const res = await CrdtGraph.Dag.build<T>({
      load,
      id: A.id,
      discoverRefs,
    });

    const getNode = (id: t.Crdt.Id) => res.nodes.find((n) => n.id === id)!;

    // Root + processed
    expect(res.root).to.eql(A.id);
    expect(res.processed).to.eql([A.id, B.id, C.id]);

    const nodeA = getNode(A.id);
    const nodeB = getNode(B.id);
    const nodeC = getNode(C.id);

    expect(nodeA.refs).to.eql([B.id]);
    expect(nodeB.refs).to.eql([C.id]);
    expect(nodeC.refs).to.eql([]);

    expect(res.edges).to.eql([
      { from: A.id, to: B.id },
      { from: B.id, to: C.id },
    ]);

    expectTypeOf(res.nodes).toEqualTypeOf<readonly t.Graph.Dag.Node<T>[]>();
  });
});
