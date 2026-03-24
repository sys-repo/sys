import { describe, expect, it } from '../-test.ts';
import { WorkspaceGraph } from './mod.ts';

describe('Workspace.Graph', () => {
  it('API', async () => {
    const m = await import('@sys/workspace/graph');
    expect(m.WorkspaceGraph).to.equal(WorkspaceGraph);
  });
});
