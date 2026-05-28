import { describe, expect, it } from '../../-test.ts';
import { WorkspaceDelta } from '../mod.ts';

describe(`@sys/workspace/delta`, () => {
  it('API', async () => {
    const m = await import('@sys/workspace/delta');
    expect(m.WorkspaceDelta).to.equal(WorkspaceDelta);
  });
});
