import { describe, expect, it } from '../../-test.ts';

import { CrdtGraph } from '../mod.ts';
import { defaultDiscoverRefs } from '../u.defaultDiscoverRefs.ts';

describe(`Crdt.Graph`, () => {
  it('API', () => {
    expect(CrdtGraph.default.discoverRefs).to.equal(defaultDiscoverRefs);
  });
});
