import { type t, describe, expect, it } from '../../-test.ts';

import { Graph } from '../mod.ts';
import { defaultDiscoverRefs } from '../u.defaultDiscoverRefs.ts';

describe(`Graph`, () => {
  it('API', async () => {
    const m = await import('@sys/immutable/graph');
    expect(m.Graph).to.equal(Graph);
    expect(Graph.default.discoverRefs).to.equal(defaultDiscoverRefs);
  });

  it('default discoverRefs behaviour → [] (empty)', async () => {
    type T = { next?: string };
    const snapshot: t.ImmutableSnapshot<T> = { current: { next: 'id:XYZ' } };

    const res = await defaultDiscoverRefs({
      id: 'root' as t.StringId,
      doc: snapshot,
      depth: 0,
    });

    // Base immutable graph does not infer edges by default.
    expect(res).to.eql([]);
  });
});
