import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { WorkspaceBump } from '../mod.ts';

describe(`@sys/workspace/bump`, () => {
  it('API', async () => {
    const m = await import('@sys/workspace/bump');
    expect(m.WorkspaceBump).to.equal(WorkspaceBump);
  });
});
