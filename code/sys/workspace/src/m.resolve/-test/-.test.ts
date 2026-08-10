import { describe, expect, it } from '../../-test.ts';
import { WorkspaceResolve } from '../mod.ts';

describe('Workspace.Resolve', () => {
  describe('API', () => {
    it('exports the resolver namespace', async () => {
      const m = await import('@sys/workspace/resolve');
      expect(m.WorkspaceResolve).to.equal(WorkspaceResolve);
    });
  });
});
