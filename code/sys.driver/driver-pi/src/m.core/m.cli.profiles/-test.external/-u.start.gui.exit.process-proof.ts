import { Process } from '@sys/process';
import { describe, expect, it } from '../../../-test.ts';
import { Path, Str } from '../common.ts';

type Scenario = 'source-q' | 'source-ctrl-c' | 'repair-q' | 'ready-q' | 'unowned';

const PACKAGE_ROOT = Path.fromFileUrl(new URL('../../../../', import.meta.url));
const FIXTURE_PATH = Path.fromFileUrl(new URL('./-start.gui.exit.process.ts', import.meta.url));
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
      const capturedText = output.text.stdout + output.text.stderr;
      const stdout = Str.trimEdgeNewlines(output.text.stdout);

      expect(output.outcome).to.eql('exited');
      expect(output.code).to.eql(1);
      expect(stdout).to.eql(`fixture ${scenario} ${state}`);
      expect(output.text.stderr).to.eql('');
      expect(output.stdoutTruncated).to.eql(false);
      expect(output.stderrTruncated).to.eql(false);
      expect(capturedText).to.not.contain('Uncaught');
      expect(capturedText).to.not.contain('start:gui materialization failed:');
      expect(capturedText).to.not.contain('u.error.ts');
      expect(capturedText).to.not.contain('u.materialize.ts');
      expect(capturedText).to.not.contain('u.gui/');
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
});

function run(scenario: Scenario) {
  return Process.capture({
    cmd: Deno.execPath(),
    args: [
      'run',
      '--quiet',
      '--frozen',
      '--no-prompt',
      '-P=test-process-child',
      FIXTURE_PATH,
      scenario,
    ],
    cwd: PACKAGE_ROOT,
    maxStdoutBytes: CAPTURE_LIMITS.bytes.stdout,
    maxStderrBytes: CAPTURE_LIMITS.bytes.stderr,
    executionTimeout: CAPTURE_LIMITS.executionTimeout,
  });
}
