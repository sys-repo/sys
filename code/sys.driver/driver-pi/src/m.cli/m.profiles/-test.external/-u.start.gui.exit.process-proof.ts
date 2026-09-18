import { Process } from '@sys/process';
import { describe, expect, it } from '../../../-test.ts';
import { Path, Str } from '../common.ts';

type Scenario = 'source-q' | 'source-ctrl-c' | 'repair-q' | 'ready-q' | 'unowned';
type Boundary = Readonly<{ name: string; entry: string }>;

const PACKAGE_ROOT = Path.fromFileUrl(new URL('../../../../', import.meta.url));
const FIXTURE_PATH = Path.fromFileUrl(new URL('./-start.gui.exit.process.ts', import.meta.url));
const ENTRY_IMPORT_MAP = Path.fromFileUrl(
  new URL('./-entry.exit.import-map.json', import.meta.url),
);
const BOUNDARIES: readonly Boundary[] = Object.freeze([
  Object.freeze({
    name: 'package-root alias',
    entry: Path.fromFileUrl(new URL('../../../mod.ts', import.meta.url)),
  }),
  Object.freeze({
    name: '/cli alias',
    entry: new URL('../../mod.ts?exit-process-entry', import.meta.url).href,
  }),
  Object.freeze({
    name: 'local task wrapper',
    entry: Path.join(PACKAGE_ROOT, '-scripts/task.cli.ts'),
  }),
]);
const FAILURE_CASES = [
  { scenario: 'source-q', state: 'failed:source-unavailable' },
  { scenario: 'source-ctrl-c', state: 'failed:source-unavailable' },
  { scenario: 'repair-q', state: 'failed:repair-required' },
] as const;

const CAPTURE_LIMITS = {
  bytes: { stdout: 32 * 1024, stderr: 32 * 1024 },
  executionTimeout: 5_000,
} as const;

const UNOWNED_ERROR = 'Uncaught (in promise) Error: unowned programmer failure';

describe('driver-pi start:gui process exit settlement', () => {
  for (const { scenario, state } of FAILURE_CASES) {
    it(`exits ${scenario} nonzero without duplicate errors or a stack`, async () => {
      const output = await run(scenario);
      const stdout = Str.trimEdgeNewlines(output.text.stdout);

      expect(output.outcome).to.eql('exited');
      expect(output.code).to.eql(1);
      expect(stdout).to.eql(`fixture ${scenario} ${state}`);
      expect(output.text.stderr).to.eql('');
      expect(output.stdoutTruncated).to.eql(false);
      expect(output.stderrTruncated).to.eql(false);
    });
  }

  it('exits a ready trusted quit with zero status', async () => {
    const output = await run('ready-q');

    expect(output.outcome).to.eql('exited');
    expect(output.code).to.eql(0);
    expect(Str.trimEdgeNewlines(output.text.stdout)).to.eql('fixture ready-q ready');
    expect(output.text.stderr).to.eql('');
  });

  it('does not convert an unowned programmer failure', async () => {
    const output = await run('unowned');

    expect(output.outcome).to.eql('exited');
    expect(output.code).to.eql(1);
    expect(output.text.stdout).to.eql('');
    expect(output.text.stderr).to.contain(UNOWNED_ERROR);
    expect(output.text.stderr).to.contain('-start.gui.exit.process.ts');
  });

  for (const boundary of BOUNDARIES) {
    it(`${boundary.name} projects failure and leaves unexpected rejection uncaught`, async () => {
      const presented = await runBoundary(boundary, 'presented-failure');
      expect(presented.outcome).to.eql('exited');
      expect(presented.code).to.eql(1);
      expect(Str.trimEdgeNewlines(presented.text.stdout)).to.eql('fixture presented failure');
      expect(presented.text.stderr).to.eql('');

      const unexpected = await runBoundary(boundary, 'unexpected-rejection');
      expect(unexpected.outcome).to.eql('exited');
      expect(unexpected.code).to.eql(1);
      expect(unexpected.text.stdout).to.eql('');
      expect(unexpected.text.stderr).to.contain(UNOWNED_ERROR);
    });
  }
});

function run(scenario: Scenario) {
  return capture(FIXTURE_PATH, scenario);
}

function runBoundary(
  boundary: Boundary,
  scenario: 'presented-failure' | 'unexpected-rejection',
) {
  return capture(boundary.entry, scenario, [`--import-map=${ENTRY_IMPORT_MAP}`]);
}

function capture(entry: string, scenario: string, options: readonly string[] = []) {
  return Process.capture({
    cmd: Deno.execPath(),
    args: [
      'run',
      '--quiet',
      '--frozen',
      '--no-prompt',
      '-P=test-process-child',
      ...options,
      entry,
      scenario,
    ],
    cwd: PACKAGE_ROOT,
    maxStdoutBytes: CAPTURE_LIMITS.bytes.stdout,
    maxStderrBytes: CAPTURE_LIMITS.bytes.stderr,
    executionTimeout: CAPTURE_LIMITS.executionTimeout,
  });
}
