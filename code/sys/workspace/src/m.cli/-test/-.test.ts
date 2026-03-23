import { describe, expect, it } from '../../-test.ts';
import { WorkspaceCli } from '../mod.ts';

describe(`Workspace.Cli`, () => {
  it('API', async () => {
    const m = await import('@sys/workspace/cli');
    expect(m.WorkspaceCli).to.equal(WorkspaceCli);
  });
});
