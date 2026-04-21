import { Cli, describe, expect, it, Testing } from '../../-test.ts';
import { WorkspaceRun } from '../mod.ts';
import { readLog, writeWorkspace } from './u.fixture.ts';

describe('WorkspaceRun', () => {
  it('runs declared package tests in topological order and skips missing tasks', async () => {
    const fs = await Testing.dir('WorkspaceRun.test');
    await writeWorkspace(fs.dir, { failCheck: false });

    const result = await WorkspaceRun.test({ cwd: fs.dir, rebuildGraph: true });
    const log = await readLog(fs.dir);

    expect(result.ok).to.eql(true);
    expect(result.task).to.eql('test');
    expect(result.cwd).to.eql(fs.dir);
    expect(result.orderedPaths).to.eql(['code/pkg-a', 'code/pkg-b', 'code/pkg-c']);
    expect(result.packages).to.have.length(3);
    expect(result.elapsed >= 0).to.eql(true);
    expect(result.packages[0]?.kind).to.eql('ran');
    if (result.packages[0]?.kind === 'ran') {
      expect(result.packages[0].path).to.eql('code/pkg-a');
      expect(result.packages[0].code).to.eql(0);
      expect(result.packages[0].success).to.eql(true);
      expect(result.packages[0].signal).to.eql(null);
      expect(result.packages[0].elapsed >= 0).to.eql(true);
    }
    expect(result.packages[1]).to.eql({ kind: 'skipped', path: 'code/pkg-b', reason: 'task:missing' });
    expect(result.packages[2]?.kind).to.eql('ran');
    if (result.packages[2]?.kind === 'ran') {
      expect(result.packages[2].path).to.eql('code/pkg-c');
      expect(result.packages[2].code).to.eql(0);
      expect(result.packages[2].success).to.eql(true);
      expect(result.packages[2].signal).to.eql(null);
      expect(result.packages[2].elapsed >= 0).to.eql(true);
    }
    expect(log).to.eql('test:pkg-a\\ntest:pkg-c\\n');
    expect(WorkspaceRun.Fmt.result(result).includes('task')).to.eql(true);
  });

  it('filters ordered paths when a package filter is provided', async () => {
    const fs = await Testing.dir('WorkspaceRun.filter');
    await writeWorkspace(fs.dir, { failCheck: false });

    const result = await WorkspaceRun.test({
      cwd: fs.dir,
      rebuildGraph: true,
      filter: (e) => e.pkg.name === '@test/pkg-c',
    });
    const log = await readLog(fs.dir);

    expect(result.ok).to.eql(true);
    expect(result.orderedPaths).to.eql(['code/pkg-c']);
    expect(result.packages).to.have.length(1);
    expect(result.packages[0]?.kind).to.eql('ran');
    if (result.packages[0]?.kind === 'ran') {
      expect(result.packages[0].path).to.eql('code/pkg-c');
    }
    expect(log).to.eql('test:pkg-c\\n');
  });

  it('formats the run summary contract', async () => {
    const fs = await Testing.dir('WorkspaceRun.fmt');
    await writeWorkspace(fs.dir, { failCheck: false });

    const result = await WorkspaceRun.test({
      cwd: fs.dir,
      rebuildGraph: true,
      filter: (e) => e.pkg.name === '@test/pkg-a' || e.pkg.name === '@test/pkg-c',
    });
    const text = Cli.stripAnsi(WorkspaceRun.Fmt.result(result));

    expect(text.includes('Workspace tests done in')).to.eql(true);
    expect(text.includes(' status    success')).to.eql(true);
    expect(text.includes(' task      test')).to.eql(true);
    expect(text.includes(' ran       2')).to.eql(true);
    expect(text.includes(' skipped   0')).to.eql(true);
    expect(text.includes(' failed    0')).to.eql(true);
    expect(text.includes('package')).to.eql(true);
    expect(text.includes('code/pkg-a')).to.eql(true);
    expect(text.includes('code/pkg-c')).to.eql(true);
  });

  it('stops on the first failing package check', async () => {
    const fs = await Testing.dir('WorkspaceRun.check');
    await writeWorkspace(fs.dir, { failCheck: true });

    const result = await WorkspaceRun.check({ cwd: fs.dir, rebuildGraph: true });
    const log = await readLog(fs.dir);

    expect(result.ok).to.eql(false);
    if (!result.ok) {
      expect(result.task).to.eql('check');
      expect(result.cwd).to.eql(fs.dir);
      expect(result.elapsed >= 0).to.eql(true);
      expect(result.orderedPaths).to.eql(['code/pkg-a', 'code/pkg-b', 'code/pkg-c']);
      expect(result.packages).to.have.length(2);
      expect(result.failure.path).to.eql('code/pkg-b');
      expect(result.failure.success).to.eql(false);
      expect(result.failure.code).to.eql(1);
      expect(result.failure.elapsed >= 0).to.eql(true);
      expect(WorkspaceRun.Fmt.result(result).includes('failed')).to.eql(true);
    }
    expect(log).to.eql('check:pkg-a\\ncheck:pkg-b\\n');
  });
});
