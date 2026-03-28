import { describe, expect, Fs, it, Testing } from '../../-test.ts';
import { Workspace } from '../m.Workspace.ts';

describe('Workspace.Prep.Workspace.normalize', () => {
  it('sorts and deduplicates the root workspace array', async () => {
    const fs = await Testing.dir('WorkspacePrep.Workspace.normalize');
    const path = Fs.join(fs.dir, 'deno.json');

    await Fs.writeJson(path, {
      workspace: ['code/zeta', 'code/alpha', 'code/zeta', 'code/beta'],
    });

    const result = await Workspace.normalize(fs.dir);
    const next = await Fs.readJson<Record<string, unknown>>(path);

    expect(result).to.eql({ changed: true, path });
    expect(next.data?.workspace).to.eql(['code/alpha', 'code/beta', 'code/zeta']);
  });

  it('returns unchanged when the workspace array is already canonical', async () => {
    const fs = await Testing.dir('WorkspacePrep.Workspace.unchanged');
    const path = Fs.join(fs.dir, 'deno.json');

    await Fs.writeJson(path, {
      workspace: ['code/alpha', 'code/beta'],
    });

    const result = await Workspace.normalize(fs.dir);
    const next = await Fs.readJson<Record<string, unknown>>(path);

    expect(result).to.eql({ changed: false, path });
    expect(next.data?.workspace).to.eql(['code/alpha', 'code/beta']);
  });
});
