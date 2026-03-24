import { describe, expect, it } from '../../-test.ts';
import { WorkspacePrep } from '../mod.ts';

describe(`Workspace.Prep`, () => {
  it('API', async () => {
    const m = await import('@sys/workspace/prep');
    expect(m.WorkspacePrep).to.equal(WorkspacePrep);
  });
});
