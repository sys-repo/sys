import { c, Cli, describe, expect, it, type t, Testing } from '../../-test.ts';
import { WorkspaceRun } from '../mod.ts';
import { readLog, writeWorkspace } from './u.fixture.ts';

describe('WorkspaceRun', () => {
  const normalizeSummary = (text: string) => Cli.stripAnsi(text).replace(/\s+/g, ' ').trim();

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
    expect(result.packages[1]).to.eql({
      kind: 'skipped',
      path: 'code/pkg-b',
      reason: 'task:missing',
    });
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

  it('runs declared package tests through the explicit parallel scheduler', async () => {
    const fs = await Testing.dir('WorkspaceRun.test.parallel');
    await writeWorkspace(fs.dir, { failCheck: false });

    const result = await WorkspaceRun.test({
      cwd: fs.dir,
      rebuildGraph: true,
      strategy: { kind: 'parallel', jobs: 2 },
    });
    const log = await readLog(fs.dir);

    expect(result.ok).to.eql(true);
    expect(result.task).to.eql('test');
    expect(result.orderedPaths).to.eql(['code/pkg-a', 'code/pkg-b', 'code/pkg-c']);
    expect(result.packages.map((item) => item.kind)).to.eql(['ran', 'skipped', 'ran']);
    expect(log).to.eql('test:pkg-a\\ntest:pkg-c\\n');
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

  it('runs declared package dry tasks in topological order', async () => {
    const fs = await Testing.dir('WorkspaceRun.dry');
    await writeWorkspace(fs.dir, { failCheck: false });

    const result = await WorkspaceRun.dry({
      cwd: fs.dir,
      rebuildGraph: true,
      filter: (e) => e.pkg.name === '@test/pkg-a' || e.pkg.name === '@test/pkg-c',
    });
    expect(result.ok).to.eql(true);
    expect(result.task).to.eql('dry');
    expect(result.orderedPaths).to.eql(['code/pkg-a', 'code/pkg-c']);
    expect(result.packages).to.have.length(2);
    expect(result.packages[0]?.kind).to.eql('ran');
    expect(result.packages[1]?.kind).to.eql('ran');
  });

  it('formats test run summary text and cyan task highlight', async () => {
    const fs = await Testing.dir('WorkspaceRun.fmt');
    await writeWorkspace(fs.dir, { failCheck: false });

    const result = await WorkspaceRun.test({
      cwd: fs.dir,
      rebuildGraph: true,
      filter: (e) => e.pkg.name === '@test/pkg-a' || e.pkg.name === '@test/pkg-c',
    });
    const formatted = WorkspaceRun.Fmt.result(result);
    const text = normalizeSummary(formatted);

    expect(text.includes('Workspace tests done in')).to.eql(true);
    expect(text.includes('status success')).to.eql(true);
    expect(text.includes('task test')).to.eql(true);
    expect(formatted.includes(c.cyan('tests'))).to.eql(true);
    expect(formatted.includes(c.cyan('test'))).to.eql(true);
    expect(text.includes('ran 2')).to.eql(true);
    expect(text.includes('skipped 0')).to.eql(true);
    expect(text.includes('failed 0')).to.eql(true);
    expect(text.includes('package')).to.eql(true);
    expect(text.includes('code/pkg-a')).to.eql(true);
    expect(text.includes('code/pkg-c')).to.eql(true);
    expect(formatted.endsWith(Cli.Fmt.hr('green'))).to.eql(true);
  });

  it('formats native test stats only from observed reports', () => {
    const observed: t.WorkspaceRun.Test.Stats.Observed = {
      kind: 'observed',
      capability: 'deno:junit',
      source: 'junit',
      tests: 3,
      failed: 1,
      failures: 1,
      errors: 0,
      skipped: 0,
      failedCases: [],
      warnings: [],
    };
    const failure = ranPackage('code/pkg-a', false, observed);
    const result: t.WorkspaceRun.Result = {
      ok: false,
      task: 'test',
      cwd: '/tmp/workspace' as t.StringDir,
      elapsed: 1,
      orderedPaths: ['code/pkg-a', 'code/pkg-b', 'code/pkg-c', 'code/pkg-d'],
      packages: [
        failure,
        ranPackage('code/pkg-b', true, {
          kind: 'unavailable',
          capability: 'deno:junit',
          source: 'junit',
          reason: 'report:missing',
        }),
        ranPackage('code/pkg-c', true, {
          kind: 'unsupported',
          capability: 'none',
          reason: 'task:not-native-deno-test',
        }),
        { kind: 'skipped', path: 'code/pkg-d', reason: 'task:missing' },
      ],
      failure,
    };
    const formatted = WorkspaceRun.Fmt.result(result);
    const text = normalizeSummary(formatted);
    const rows = Cli.stripAnsi(formatted)
      .split('\n')
      .map((line) => line.trim().replace(/\s+/g, ' '));

    expect(text.includes('tests 3')).to.eql(true);
    expect(text.includes('test failed 1')).to.eql(true);
    expect(text.includes('reports 1/3 observed, 1 unavailable, 1 unsupported')).to.eql(true);
    expect(rows.includes('package status elapsed tests failed')).to.eql(true);
    expect(rows.includes('code/pkg-a failed 1ms 3 1')).to.eql(true);
    expect(rows.includes('code/pkg-b ok 1ms — —')).to.eql(true);
    expect(rows.includes('code/pkg-c ok 1ms — —')).to.eql(true);
    expect(rows.includes('code/pkg-d skipped — — —')).to.eql(true);
  });

  it('formats dry run summary text and cyan task highlight', async () => {
    const fs = await Testing.dir('WorkspaceRun.fmt.dry');
    await writeWorkspace(fs.dir, { failCheck: false });

    const result = await WorkspaceRun.dry({
      cwd: fs.dir,
      rebuildGraph: true,
      filter: (e) => e.pkg.name === '@test/pkg-a',
    });
    const formatted = WorkspaceRun.Fmt.result(result);
    const text = normalizeSummary(formatted);

    expect(text.includes('Workspace dry runs done in')).to.eql(true);
    expect(text.includes('task dry')).to.eql(true);
    expect(formatted.includes(c.cyan('dry runs'))).to.eql(true);
    expect(formatted.includes(c.cyan('dry'))).to.eql(true);
    expect(formatted.endsWith(Cli.Fmt.hr('green'))).to.eql(true);
  });

  it('repeats the status summary after long package tables', () => {
    const packages = Array.from({ length: 11 }, (_, count) => ({
      kind: 'ran' as const,
      path: `code/pkg-${count}`,
      code: 0,
      success: true,
      signal: null,
      elapsed: 1,
    }));
    const formatted = WorkspaceRun.Fmt.result({
      ok: true,
      task: 'test',
      cwd: '/tmp/workspace',
      elapsed: 1,
      orderedPaths: packages.map((item) => item.path),
      packages,
    });
    const rows = Cli.stripAnsi(formatted)
      .split('\n')
      .map((line) => line.trim().replace(/\s+/g, ' '));
    const summary = ['status success', 'task test', 'ran 11', 'skipped 0', 'failed 0'];
    const headerStatus = rows.indexOf(summary[0]!);
    const footerStatus = rows.lastIndexOf(summary[0]!);
    const packageHeader = rows.indexOf('package status elapsed');

    expect(headerStatus >= 0).to.eql(true);
    expect(footerStatus > headerStatus).to.eql(true);
    expect(packageHeader > headerStatus).to.eql(true);
    expect(packageHeader < footerStatus).to.eql(true);
    expect(rows.slice(headerStatus, headerStatus + summary.length)).to.eql(summary);
    expect(rows.slice(footerStatus, footerStatus + summary.length)).to.eql(summary);
    expect(rows[headerStatus - 2]?.startsWith('━')).to.eql(true);
    expect(rows[headerStatus - 1]).to.eql('');
    expect(rows[footerStatus - 2] !== '').to.eql(true);
    expect(rows[footerStatus - 1]).to.eql('');
    expect(rows[footerStatus + summary.length]).to.eql('');
    expect(rows[footerStatus + summary.length + 1]?.startsWith('━')).to.eql(true);
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

function ranPackage(
  path: t.StringPath,
  success: boolean,
  testStats: t.WorkspaceRun.Test.Stats.Result,
): t.WorkspaceRun.Package.Ran {
  return {
    kind: 'ran',
    path,
    code: success ? 0 : 1,
    success,
    signal: null,
    elapsed: 1,
    testStats,
  };
}
