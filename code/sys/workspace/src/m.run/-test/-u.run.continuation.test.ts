import { describe, expect, it, Testing } from '../../-test.ts';
import { WorkspaceRun } from '../mod.ts';
import { readLog, writeWorkspace } from './u.fixture.ts';

describe('WorkspaceRun.parallel continuation', () => {
  it('continues the public parallel test run after a predecessor fails', async () => {
    const fs = await Testing.dir('WorkspaceRun.test.parallel.failure');
    await writeWorkspace(fs.dir, { failCheck: false, failTest: true });

    const result = await WorkspaceRun.test({
      cwd: fs.dir,
      rebuildGraph: true,
      strategy: { kind: 'parallel', jobs: 1 },
    });
    const log = await readLog(fs.dir);

    expect(result.ok).to.eql(false);
    if (!result.ok) expect(result.failure.path).to.eql('code/pkg-a');
    expect(result.packages.map((item) => item.kind)).to.eql(['ran', 'skipped', 'ran']);
    expect(result.packages.map((item) => item.path)).to.eql([
      'code/pkg-a',
      'code/pkg-b',
      'code/pkg-c',
    ]);
    expect(log).to.eql('test:pkg-a\\ntest:pkg-c\\n');
  });
});
