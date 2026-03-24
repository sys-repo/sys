import { describe, expect, Fs, it, Testing } from '../../-test.ts';
import { State } from '../m.State.ts';

describe('Workspace.Prep.State', () => {
  it('resolves canonical prep file locations from a cwd', async () => {
    const fs = await Testing.dir('WorkspacePrep.State.paths');

    expect(State.workspaceFile(fs.dir)).to.eql(Fs.join(fs.dir, 'deno.json'));
    expect(State.graphFile(fs.dir)).to.eql(Fs.join(fs.dir, '.tmp', 'workspace.graph.json'));
  });
});
