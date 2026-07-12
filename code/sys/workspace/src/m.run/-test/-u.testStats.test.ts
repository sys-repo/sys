import { describe, expect, Fs, it, Str, type t, Testing } from '../../-test.ts';
import {
  classifyNativeTestTask,
  createNativeTestStatsRun,
  parseNativeTestStatsReport,
} from '../u/u.testStats.ts';
import { resolveCommand, runPackage } from '../u/u.worker.ts';
import { WorkspaceRun } from '../mod.ts';

const SAMPLE_JUNIT = Str.dedent(`
  <?xml version="1.0" encoding="UTF-8"?>
  <testsuites tests="3" failures="1" errors="1" skipped="1" time="0.350">
    <testsuite name="sample" tests="3" failures="1" errors="1" skipped="1">
      <testcase classname="sample" name="passes" time="0.100" />
      <testcase classname="sample" name="fails" time="0.200">
        <failure message="boom">stack</failure>
      </testcase>
      <testcase classname="sample" name="errors" time="0.050">
        <error>bad</error>
        <skipped />
      </testcase>
    </testsuite>
  </testsuites>
`);

describe('WorkspaceRun.native test stats', () => {
  describe('classifyNativeTestTask', () => {
    it('supports simple native deno test tasks', () => {
      const result = classifyNativeTestTask('deno test -P=test ./src/m.run');

      expect(result.kind).to.eql('supported');
      if (result.kind === 'supported') {
        expect(result.tokens).to.eql(['deno', 'test', '-P=test', './src/m.run']);
      }
    });

    it('rejects composite, non-test, existing-junit, and argument-terminator tasks', () => {
      expect(classifyNativeTestTask('deno test -P=test && deno test ./extra')).to.eql({
        kind: 'unsupported',
        command: 'deno test -P=test && deno test ./extra',
        reason: 'task:composite',
        tokens: undefined,
      });
      expect(classifyNativeTestTask('deno run ./scripts/test.ts')).to.eql({
        kind: 'unsupported',
        command: 'deno run ./scripts/test.ts',
        reason: 'task:not-native-deno-test',
        tokens: ['deno', 'run', './scripts/test.ts'],
      });
      expect(classifyNativeTestTask('deno test --junit-path ./report.xml')).to.eql({
        kind: 'unsupported',
        command: 'deno test --junit-path ./report.xml',
        reason: 'task:existing-junit-path',
        tokens: ['deno', 'test', '--junit-path', './report.xml'],
      });
      expect(classifyNativeTestTask('deno test -- --fixture')).to.eql({
        kind: 'unsupported',
        command: 'deno test -- --fixture',
        reason: 'task:unsupported-args',
        tokens: ['deno', 'test', '--', '--fixture'],
      });
    });
  });

  describe('parseNativeTestStatsReport', () => {
    it('observes testcase counts, failures, skipped counts, durations, and failed identities', () => {
      const stats = parseNativeTestStatsReport(SAMPLE_JUNIT);

      expect(stats).to.eql({
        kind: 'observed',
        capability: 'deno:junit',
        source: 'junit',
        tests: 3,
        failed: 2,
        failures: 1,
        errors: 1,
        skipped: 1,
        duration: 350,
        failedCases: [
          { kind: 'failure', name: 'fails', className: 'sample', message: 'boom' },
          { kind: 'error', name: 'errors', className: 'sample', message: 'bad' },
        ],
        warnings: [],
      });
    });

    it('reports malformed XML as unavailable rather than fabricated zeroes', () => {
      const stats = parseNativeTestStatsReport('<testsuite>');

      expect(stats.kind).to.eql('unavailable');
      if (stats.kind === 'unavailable') {
        expect(stats.capability).to.eql('deno:junit');
        expect(stats.source).to.eql('junit');
        expect(stats.reason).to.eql('report:parse-failed');
        expect(Boolean(stats.message?.trim())).to.eql(true);
      }
    });
  });

  describe('createNativeTestStatsRun', () => {
    it('marks unsupported package tasks without changing the command', async () => {
      const run = await createNativeTestStatsRun();
      try {
        const prepared = run.prepare({
          task: 'test',
          packagePath: 'code/pkg-a',
          deno: { tasks: { test: 'deno eval "console.log(1)"' } },
          command: { cmd: 'deno', args: ['task', 'test'] },
        });

        expect(prepared.command).to.eql({ cmd: 'deno', args: ['task', 'test'] });
        expect(await prepared.collect()).to.eql({
          kind: 'unsupported',
          capability: 'none',
          reason: 'task:not-native-deno-test',
          command: 'deno eval "console.log(1)"',
        });
      } finally {
        await run.cleanup();
      }
    });

    it('collects observed JUnit stats through runPackage and cleans temp artifacts', async () => {
      const fs = await Testing.dir('WorkspaceRun.native-test-stats');
      const deno = { tasks: { test: 'deno test ./mod_test.ts' } };
      const candidate = packageCandidate(deno);
      await writeNativePackage(fs.dir, candidate);

      const command = resolveCommand(deno, 'test');
      if (!command) throw new Error('Expected a package test command.');
      const run = await createNativeTestStatsRun();
      expect(command).to.eql({ cmd: 'deno', args: ['task', 'test'] });
      expect(Boolean(run.dir)).to.eql(true);

      try {
        const result = await runPackage({
          cwd: fs.dir,
          task: 'test',
          candidate,
          command,
          stdio: 'buffered',
          testStats: run,
        });

        expectObservedStats(result);
        expect(await Fs.exists(Fs.join(fs.dir, candidate.dir, 'code__pkg-a.junit.xml'))).to.eql(
          false,
        );
      } finally {
        await run.cleanup();
      }

      if (run.dir) expect(await Fs.exists(run.dir)).to.eql(false);
    });

    it('attaches observed stats through the public parallel workspace test runner', async () => {
      const fs = await Testing.dir('WorkspaceRun.native-test-stats-public');
      const deno = { tasks: { test: 'deno test ./mod_test.ts' } };
      const candidate = packageCandidate(deno);
      await Fs.writeJson(Fs.join(fs.dir, 'deno.json'), { workspace: [candidate.dir] });
      await writeNativePackage(fs.dir, candidate);

      const result = await WorkspaceRun.test({
        cwd: fs.dir,
        rebuildGraph: true,
        strategy: { kind: 'parallel', jobs: 1 },
      });

      expect(result.ok).to.eql(true);
      expect(result.packages).to.have.length(1);
      const item = result.packages[0];
      expect(item?.kind).to.eql('ran');
      if (item?.kind === 'ran') expectObservedStats(item);
      expect(await Fs.exists(Fs.join(fs.dir, candidate.dir, 'code__pkg-a.junit.xml'))).to.eql(
        false,
      );
    });
  });
});

/**
 * Helpers:
 */
type NativeDeno = { readonly tasks: Record<string, string> };

function packageCandidate(deno: NativeDeno) {
  return {
    dir: 'code/pkg-a' as t.StringDir,
    pkg: { name: '@test/pkg-a', version: '1.0.0' },
    deno,
  };
}

async function writeNativePackage(
  cwd: t.StringDir,
  candidate: ReturnType<typeof packageCandidate>,
) {
  await Fs.writeJson(Fs.join(cwd, candidate.dir, 'deno.json'), {
    name: candidate.pkg.name,
    version: candidate.pkg.version,
    exports: { '.': './mod.ts' },
    tasks: candidate.deno.tasks,
  });
  await Fs.write(Fs.join(cwd, candidate.dir, 'mod.ts'), 'export const value = 1;\n');
  await Fs.write(Fs.join(cwd, candidate.dir, 'mod_test.ts'), passTestSource());
}

function expectObservedStats(result: t.WorkspaceRun.Package.Ran) {
  expect(result.success).to.eql(true);
  expect(result.testStats?.kind).to.eql('observed');
  if (result.testStats?.kind === 'observed') {
    expect(result.testStats.capability).to.eql('deno:junit');
    expect(result.testStats.source).to.eql('junit');
    expect(result.testStats.tests).to.eql(1);
    expect(result.testStats.failed).to.eql(0);
  }
}

function passTestSource() {
  return Str.dedent(`
    Deno.test('native pass', () => {
      if (1 !== 1) throw new Error('unreachable');
    });
  `);
}
