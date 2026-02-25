import { describe, expect, it } from '../../../../-test.ts';
import { isDagLike } from '../u.dag.ts';

describe('u.dag', () => {
  it('guards the minimal transform DAG boundary shape', () => {
    expect(isDagLike({})).to.equal(false);
    expect(isDagLike({ nodes: {} })).to.equal(false);
    expect(isDagLike({ nodes: [] })).to.equal(true);
    expect(isDagLike({ nodes: [{ id: 'crdt:x' }] })).to.equal(true);
  });
});
