import { describe, expect, it, Testing } from '../../-test.ts';
import { WorkspaceRun } from '../mod.ts';
import { readLog, writeWorkspace } from './u.fixture.ts';

describe('WorkspaceRun', () => {
  it('runs declared package tests in topological order and skips missing tasks', async () => {
    const fs = await Testing.dir('WorkspaceRun.test');
    await writeWorkspace(fs.dir, { failCheck: false });

    const result = await WorkspaceRun.test({ cwd: fs.dir });
    const log = await readLog(fs.dir);

    expect(result).to.eql({
      ok: true,
      task: 'test',
      cwd: fs.dir,
      orderedPaths: ['code/pkg-a', 'code/pkg-b', 'code/pkg-c'],
      packages: [
        { kind: 'ran', path: 'code/pkg-a', code: 0, success: true, signal: null },
        { kind: 'skipped', path: 'code/pkg-b', reason: 'task:missing' },
        { kind: 'ran', path: 'code/pkg-c', code: 0, success: true, signal: null },
      ],
    });
    expect(log).to.eql('test:pkg-a\\ntest:pkg-c\\n');
  });

  it('stops on the first failing package check', async () => {
    const fs = await Testing.dir('WorkspaceRun.check');
    await writeWorkspace(fs.dir, { failCheck: true });

    const result = await WorkspaceRun.check({ cwd: fs.dir });
    const log = await readLog(fs.dir);

    expect(result).to.eql({
      ok: false,
      task: 'check',
      cwd: fs.dir,
      orderedPaths: ['code/pkg-a', 'code/pkg-b', 'code/pkg-c'],
      packages: [
        { kind: 'ran', path: 'code/pkg-a', code: 0, success: true, signal: null },
        { kind: 'ran', path: 'code/pkg-b', code: 1, success: false, signal: null },
      ],
      failure: { kind: 'ran', path: 'code/pkg-b', code: 1, success: false, signal: null },
    });
    expect(log).to.eql('check:pkg-a\\ncheck:pkg-b\\n');
  });
});
