import { describe, expect, it, type t } from '../../-test.ts';
import { Process } from '../mod.ts';
import { ProcessTest } from './u.fixture.ts';

const DEFAULT_CAPS = {
  maxStdoutBytes: 1_024,
  maxStderrBytes: 1_024,
} as const;

describe('Process.capture', () => {
  it('captures stdout and stderr from argv execution', async () => {
    const res = await captureEval(`
      await Deno.stdout.write(new TextEncoder().encode('out'));
      await Deno.stderr.write(new TextEncoder().encode('err'));
    `);

    expect(res.outcome).to.eql('exited');
    expect(res.code).to.eql(0);
    expect(res.success).to.eql(true);
    expect(res.text.stdout).to.eql('out');
    expect(res.text.stderr).to.eql('err');
    expect(res.stdoutTruncated).to.eql(false);
    expect(res.stderrTruncated).to.eql(false);
    expect(res.toString()).to.eql('out');
  });

  it('preserves env pass-through and defaults FORCE_COLOR=1', async () => {
    const res = await captureEval(
      `
        const out = [Deno.env.get('PROCESS_CAPTURE_ENV'), Deno.env.get('FORCE_COLOR')].join(':');
        await Deno.stdout.write(new TextEncoder().encode(out));
      `,
      { env: { PROCESS_CAPTURE_ENV: 'ok' } },
    );

    expect(res.text.stdout).to.eql('ok:1');
  });

  it('allows callers to override FORCE_COLOR', async () => {
    const res = await captureEval(
      `
        await Deno.stdout.write(new TextEncoder().encode(Deno.env.get('FORCE_COLOR') ?? ''));
      `,
      { env: { FORCE_COLOR: '0' } },
    );

    expect(res.text.stdout).to.eql('0');
  });

  it('returns nonzero exit status without throwing', async () => {
    const res = await captureEval(`
      await Deno.stderr.write(new TextEncoder().encode('nope'));
      Deno.exit(7);
    `);

    expect(res.outcome).to.eql('exited');
    expect(res.code).to.eql(7);
    expect(res.success).to.eql(false);
    expect(res.text.stderr).to.eql('nope');
    expect(res.toString()).to.eql('nope');
  });

  it('throws programmer errors for malformed capture config', async () => {
    const byteCapError = await ProcessTest.catchError(() =>
      Process.capture({
        args: [],
        maxStdoutBytes: -1,
        maxStderrBytes: 1,
      })
    );
    const cmdError = await ProcessTest.catchError(() =>
      Process.capture({
        cmd: '',
        args: [],
        ...DEFAULT_CAPS,
      })
    );

    expect(byteCapError?.message).to.eql('Process.capture: invalid maxStdoutBytes: -1.');
    expect(cmdError?.message).to.eql('Process.capture: invalid cmd: .');
  });

  it('truncates stdout exactly at maxStdoutBytes', async () => {
    const res = await captureEval(
      `await Deno.stdout.write(new TextEncoder().encode('abcdef'));`,
      { maxStdoutBytes: 3 },
    );

    expect(res.outcome).to.eql('exited');
    expect(res.stdout.length).to.eql(3);
    expect(res.text.stdout).to.eql('abc');
    expect(res.stdoutTruncated).to.eql(true);
    expect(res.stderrTruncated).to.eql(false);
  });

  it('truncates stderr exactly at maxStderrBytes', async () => {
    const res = await captureEval(
      `await Deno.stderr.write(new TextEncoder().encode('abcdef'));`,
      { maxStderrBytes: 4 },
    );

    expect(res.outcome).to.eql('exited');
    expect(res.stderr.length).to.eql(4);
    expect(res.text.stderr).to.eql('abcd');
    expect(res.stdoutTruncated).to.eql(false);
    expect(res.stderrTruncated).to.eql(true);
  });

  it('supports zero-byte caps while still draining child output to completion', async () => {
    const res = await captureEval(
      `
        await Deno.stdout.write(new TextEncoder().encode('stdout'));
        await Deno.stderr.write(new TextEncoder().encode('stderr'));
      `,
      { maxStdoutBytes: 0, maxStderrBytes: 0 },
    );

    expect(res.outcome).to.eql('exited');
    expect(res.success).to.eql(true);
    expect(res.stdout.length).to.eql(0);
    expect(res.stderr.length).to.eql(0);
    expect(res.stdoutTruncated).to.eql(true);
    expect(res.stderrTruncated).to.eql(true);
  });

  it('drains output beyond the cap without pipe deadlock', async () => {
    const res = await captureEval(
      `
        const chunk = new Uint8Array(64 * 1024).fill(65);
        for (let count = 0; count < 64; count++) await Deno.stdout.write(chunk);
      `,
      { maxStdoutBytes: 8, timeoutMs: 5_000 },
    );

    expect(res.outcome).to.eql('exited');
    expect(res.success).to.eql(true);
    expect(res.stdout.length).to.eql(8);
    expect(res.text.stdout).to.eql('AAAAAAAA');
    expect(res.stdoutTruncated).to.eql(true);
  });

  it('returns timed-out and records SIGTERM termination', async () => {
    const res = await captureEval(
      `setInterval(() => {}, 1_000);`,
      { timeoutMs: 25, killGraceMs: 100 },
    );

    expect(res.outcome).to.eql('timed-out');
    expect(res.success).to.eql(false);
    expect(res.termination.reason).to.eql('timeout');
    expect(res.termination.actions.map((action) => action.signal)[0]).to.eql('SIGTERM');
  });

  it('escalates SIGTERM → SIGKILL when the child handles SIGTERM but does not exit', async () => {
    const res = await captureEval(
      `
        Deno.addSignalListener('SIGTERM', () => undefined);
        setInterval(() => {}, 1_000);
      `,
      { timeoutMs: 250, killGraceMs: 25 },
    );

    expect(res.outcome).to.eql('timed-out');
    expect(res.termination.actions.map((action) => action.signal)).to.eql(['SIGTERM', 'SIGKILL']);
  });

  it('returns cancelled for a pre-aborted signal without spawning', async () => {
    const controller = new AbortController();
    controller.abort();

    const res = await Process.capture({
      cmd: '/missing/process-capture-pre-abort',
      args: [],
      signal: controller.signal,
      ...DEFAULT_CAPS,
    });

    expect(res.outcome).to.eql('cancelled');
    expect(res.status).to.eql(null);
    expect(res.code).to.eql(null);
    expect(res.success).to.eql(false);
    expect(res.termination).to.eql({ reason: 'cancelled', actions: [] });
  });

  it('returns cancelled for an abort after spawn and records termination actions', async () => {
    const controller = new AbortController();
    const running = captureEval(
      `setInterval(() => {}, 1_000);`,
      { signal: controller.signal, timeoutMs: 5_000, killGraceMs: 100 },
    );

    controller.abort();
    const res = await running;

    expect(res.outcome).to.eql('cancelled');
    expect(res.success).to.eql(false);
    expect(res.termination.reason).to.eql('cancelled');
    expect(res.termination.actions.map((action) => action.signal)[0]).to.eql('SIGTERM');
  });

  it('returns failed-to-start for a missing command path', async () => {
    const res = await Process.capture({
      cmd: '/missing/process-capture-command',
      args: [],
      ...DEFAULT_CAPS,
    });

    if (res.outcome !== 'failed-to-start') throw new Error(`Unexpected outcome: ${res.outcome}`);
    expect(res.status).to.eql(null);
    expect(res.code).to.eql(null);
    expect(res.success).to.eql(false);
    expect(res.stdout.length).to.eql(0);
    expect(res.stderr.length).to.eql(0);
    expect(res.toString()).to.eql('');
    expect(res.error).not.to.eql(undefined);
  });

  it('keeps text and toString aligned with Process.Output', async () => {
    const success = await captureEval(`
      await Deno.stdout.write(new TextEncoder().encode('ok'));
      await Deno.stderr.write(new TextEncoder().encode('diagnostic'));
    `);
    const failure = await captureEval(`
      await Deno.stderr.write(new TextEncoder().encode('bad'));
      Deno.exit(1);
    `);

    expect(success.toString()).to.eql(success.text.stdout);
    expect(failure.toString()).to.eql(failure.text.stderr);
  });
});

function captureEval(
  code: string,
  options: Partial<Omit<t.Process.CaptureArgs, 'args'>> = {},
) {
  return Process.capture({
    args: ProcessTest.evalArgs(code),
    ...DEFAULT_CAPS,
    ...options,
  });
}
