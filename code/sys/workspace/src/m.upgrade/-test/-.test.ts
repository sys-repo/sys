import { describe, expect, it } from '../../-test.ts';
import { WorkspaceUpgrade } from '../mod.ts';

describe(`Workspace.Upgrade`, () => {
  it('API', async () => {
    const m = await import('@sys/workspace/upgrade');
    expect(m.WorkspaceUpgrade).to.equal(WorkspaceUpgrade);
  });
});
