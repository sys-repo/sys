import { describe, expect, it, Str, type t } from '../../-test.ts';

import { assertBuildOk } from '../-test.external/u.fixture.build.ts';
import {
  assertRunOk,
  commandRun,
  FIXTURE_CAPTURE,
  operationRun,
  toCommandRun,
} from '../-test.external/u.fixture.task.ts';

describe('Vite external fixture diagnostics', () => {
  it('preserves failed task command context', () => {
    expect(() =>
      assertRunOk(
        commandRun({
          cwd: '/fixture',
          cmd: ['deno', 'task', 'build'],
          ok: false,
          code: 7,
          stdout: 'task output',
          stderr: 'task error',
        }),
        'Fixture task failed',
      )
    ).to.throw(
      Str.dedent(`
        Fixture task failed (exit 7)
        cwd: /fixture
        cmd: deno task build

        stdout:
        task output

        stderr:
        task error
      `),
    );
  });

  it('maps capture timeout and truncation into command evidence', () => {
    const output: t.Process.CaptureTimedOutOutput = {
      ...captureBase({ stdout: 'partial output', stdoutTruncated: true }),
      outcome: 'timed-out',
      status: null,
      code: null,
      success: false,
      signal: null,
      termination: { reason: 'timeout', actions: [] },
    };
    const run = toCommandRun({
      cwd: '/fixture',
      cmd: ['deno', 'task', 'build'],
      output,
    });

    expect(() => assertRunOk(run, 'Fixture task failed')).to.throw(
      Str.dedent(`
        Fixture task failed (timed out after ${FIXTURE_CAPTURE.timeoutMs}ms)
        cwd: /fixture
        cmd: deno task build

        stdout:
        partial output
        [stdout truncated: output beyond ${FIXTURE_CAPTURE.maxStdoutBytes} bytes omitted]

        stderr:
        (empty)
      `),
    );
  });

  it('maps failed process start detail into command evidence', () => {
    const output: t.Process.CaptureFailedToStartOutput = {
      ...captureBase(),
      outcome: 'failed-to-start',
      status: null,
      code: null,
      success: false,
      signal: null,
      termination: { reason: null, actions: [] },
      error: new Error('spawn denied'),
    };
    const run = toCommandRun({ cwd: '/fixture', cmd: ['missing-command'], output });

    expect(run.status).to.eql('failed to start');
    expect(run.stderr).to.include('process error: Error: spawn denied');
    expect(() => assertRunOk(run, 'Fixture task failed')).to.throw(
      Str.dedent(`
        Fixture task failed (failed to start)
        cwd: /fixture
        cmd: missing-command

        stdout:
        (empty)

        stderr:
        process error: Error: spawn denied
      `),
    );
  });

  it('identifies failed in-process fixture work as an operation', () => {
    expect(() =>
      assertRunOk(
        operationRun({
          cwd: '/fixture',
          operation: 'workspace patch',
          ok: false,
          code: 1,
          stdout: '',
          stderr: 'write failed',
        }),
        'Fixture operation failed',
      )
    ).to.throw(
      Str.dedent(`
        Fixture operation failed (status 1)
        cwd: /fixture
        operation: workspace patch

        stdout:
        (empty)

        stderr:
        write failed
      `),
    );
  });

  it('preserves failed build command context', () => {
    expect(() =>
      assertBuildOk(
        {
          ok: false,
          paths: { cwd: '/fixture' },
          cmd: {
            input: 'deno run vite build',
            output: {
              code: 9,
              text: { stdout: 'build output', stderr: 'build error' },
            },
          },
        },
        'Fixture build failed',
      )
    ).to.throw(
      Str.dedent(`
        Fixture build failed (exit 9)
        cwd: /fixture
        cmd: deno run vite build

        stdout:
        build output

        stderr:
        build error
      `),
    );
  });
});

function captureBase(
  args: {
    readonly stdout?: string;
    readonly stderr?: string;
    readonly stdoutTruncated?: boolean;
    readonly stderrTruncated?: boolean;
  } = {},
): t.Process.CaptureBaseOutput {
  const {
    stdout = '',
    stderr = '',
    stdoutTruncated = false,
    stderrTruncated = false,
  } = args;
  const encoder = new TextEncoder();
  return {
    stdout: encoder.encode(stdout),
    stderr: encoder.encode(stderr),
    text: { stdout, stderr },
    stdoutTruncated,
    stderrTruncated,
    toString: () => stderr || stdout,
  };
}
