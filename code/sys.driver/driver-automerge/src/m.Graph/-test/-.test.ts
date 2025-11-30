import { Graph, describe, expect, it } from '../../-test.ts';

import { CrdtGraph } from '../mod.ts';
import { defaultDiscoverRefs } from '../u.defaultDiscoverRefs.ts';

describe(`Crdt.Graph`, () => {
  it('API', () => {
    expect(CrdtGraph.default.discoverRefs).to.equal(defaultDiscoverRefs);

    expect(CrdtGraph.Dag.forEach).to.equal(Graph.Dag.forEach);
    expect(CrdtGraph.Dag.forEachAsync).to.equal(Graph.Dag.forEachAsync);
    expect(CrdtGraph.Dag.index).to.equal(Graph.Dag.index);
  });
});
