import { describe, expect, it, type t, Time } from '../../../-test.ts';
import { Process } from '../../mod.ts';
import { ProcessTest } from '../../-test/u.fixture.ts';
import { captureWith } from '../u.capture.ts';

const DEFAULT_CAPS = {
  maxStdoutBytes: 1_024,
  maxStderrBytes: 1_024,
} as const;

describe('Process.capture', () => {
  describe('result contract', () => {
    it('argv exit → returns both output streams as an exited result', async () => {
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

    it('nonzero exit → remains an exited result without throwing', async () => {
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

    it('missing executable → remains distinct as failed-to-start', async () => {
      const res = await Process.capture({
        cmd: '/missing/process-capture-command',
        args: [],
        ...DEFAULT_CAPS,
      });

      expect(res.outcome).to.eql('failed-to-start');
      if (res.outcome !== 'failed-to-start') throw new Error(`Unexpected outcome: ${res.outcome}`);
      expect(res.status).to.eql(null);
      expect(res.code).to.eql(null);
      expect(res.success).to.eql(false);
      expect(res.stdout.length).to.eql(0);
      expect(res.stderr.length).to.eql(0);
      expect(res.toString()).to.eql('');
      expect(res.error).not.to.eql(undefined);
    });

    it('string projection → follows Process.Output success and failure semantics', async () => {
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

  describe('environment authority', () => {
    it('inherited environment → adds explicit values and default color policy', async () => {
      const res = await captureEval(
        `
          const out = [Deno.env.get('PROCESS_CAPTURE_ENV'), Deno.env.get('FORCE_COLOR')].join(':');
          await Deno.stdout.write(new TextEncoder().encode(out));
        `,
        { env: { PROCESS_CAPTURE_ENV: 'ok' } },
      );

      expect(res.text.stdout).to.eql('ok:1');
    });

    it('clearEnv → removes parent values while preserving explicit and default values', async () => {
      const parentOnly = 'SYS_PROCESS_CAPTURE_PARENT_ONLY_TEST';
      const previous = Deno.env.get(parentOnly);
      Deno.env.set(parentOnly, 'secret');

      try {
        const res = await captureEval(
          `
            const out = [
              Deno.env.get('SYS_PROCESS_CAPTURE_PARENT_ONLY_TEST') ?? 'absent',
              Deno.env.get('PROCESS_CAPTURE_EXPLICIT') ?? 'absent',
              Deno.env.get('FORCE_COLOR') ?? 'absent',
            ].join(':');
            await Deno.stdout.write(new TextEncoder().encode(out));
          `,
          {
            clearEnv: true,
            env: { PROCESS_CAPTURE_EXPLICIT: 'owned' },
          },
        );

        expect(res.text.stdout).to.eql('absent:owned:1');
      } finally {
        if (previous === undefined) Deno.env.delete(parentOnly);
        else Deno.env.set(parentOnly, previous);
      }
    });

    it('explicit FORCE_COLOR → overrides the capture default', async () => {
      const res = await captureEval(
        `
          await Deno.stdout.write(new TextEncoder().encode(Deno.env.get('FORCE_COLOR') ?? ''));
        `,
        { env: { FORCE_COLOR: '0' } },
      );

      expect(res.text.stdout).to.eql('0');
    });
  });

  describe('input bounds', () => {
    it('duration contract → accepts lifecycle names and rejects removed names', () => {
      const current = {
        args: [],
        executionTimeout: 0 as t.Msecs,
        terminationGrace: 0 as t.Msecs,
        ...DEFAULT_CAPS,
      } satisfies t.Process.CaptureArgs;
      const removedExecution: t.Process.CaptureArgs = {
        args: [],
        ...DEFAULT_CAPS,
        // @ts-expect-error timeoutMs was replaced by executionTimeout.
        timeoutMs: 0 as t.Msecs,
      };
      const removedTermination: t.Process.CaptureArgs = {
        args: [],
        ...DEFAULT_CAPS,
        // @ts-expect-error killGraceMs was replaced by terminationGrace.
        killGraceMs: 0 as t.Msecs,
      };

      expect(current.executionTimeout).to.eql(0);
      expect(current.terminationGrace).to.eql(0);
      void removedExecution;
      void removedTermination;
    });

    it('malformed command or byte cap → rejects as programmer error', async () => {
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

    it('timer ceiling → accepts MAX and rejects MAX + 1 before child acquisition', async () => {
      let acceptedSpawns = 0;
      const closedStream = () =>
        new ReadableStream<Uint8Array>({
          start(controller) {
            controller.close();
          },
        });
      const accepted = await captureWith(
        () => {
          acceptedSpawns++;
          return fakeChild({
            status: Promise.resolve({ success: true, code: 0, signal: null }),
            stdout: closedStream(),
            stderr: closedStream(),
          });
        },
        {
          args: [],
          executionTimeout: Time.Delay.MAX,
          terminationGrace: Time.Delay.MAX,
          ...DEFAULT_CAPS,
        },
      );

      expect(accepted.outcome).to.eql('exited');
      expect(acceptedSpawns).to.eql(1);

      for (
        const item of [
          {
            label: 'executionTimeout',
            input: { executionTimeout: Time.Delay.MAX + 1 },
          },
          {
            label: 'terminationGrace',
            input: { terminationGrace: Time.Delay.MAX + 1 },
          },
        ] as const
      ) {
        let spawnCalls = 0;
        const error = await ProcessTest.catchError(() =>
          captureWith(
            () => {
              spawnCalls++;
              throw new Error('spawn must not run');
            },
            { args: [], ...DEFAULT_CAPS, ...item.input },
          )
        );

        expect(error?.message).to.eql(
          `Process.capture: invalid ${item.label}: ${Time.Delay.MAX + 1}.`,
        );
        expect(spawnCalls).to.eql(0);
      }
    });
  });

  describe('output bounds', () => {
    it('stdout cap → retains the exact prefix and marks truncation', async () => {
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

    it('stderr cap → retains the exact prefix and marks truncation', async () => {
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

    it('zero-byte caps → retain nothing while draining both streams', async () => {
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

    it('output beyond cap → drains the child without pipe deadlock', async () => {
      const res = await captureEval(
        `
          const chunk = new Uint8Array(64 * 1024).fill(65);
          for (let count = 0; count < 64; count++) await Deno.stdout.write(chunk);
        `,
        { maxStdoutBytes: 8, executionTimeout: 5_000 },
      );

      expect(res.outcome).to.eql('exited');
      expect(res.success).to.eql(true);
      expect(res.stdout.length).to.eql(8);
      expect(res.text.stdout).to.eql('AAAAAAAA');
      expect(res.stdoutTruncated).to.eql(true);
    });
  });

  describe('termination triggers', () => {
    it('execution timeout → requests SIGTERM and returns timed-out', async () => {
      const res = await captureEval(
        `setInterval(() => {}, 1_000);`,
        { executionTimeout: 25, terminationGrace: 100 },
      );

      expect(res.outcome).to.eql('timed-out');
      expect(res.success).to.eql(false);
      expect(res.termination.reason).to.eql('timeout');
      expect(res.termination.actions.map((action) => action.signal)[0]).to.eql('SIGTERM');
    });

    it('SIGTERM without exit → escalates to SIGKILL', async () => {
      const res = await captureEval(
        `
          Deno.addSignalListener('SIGTERM', () => undefined);
          setInterval(() => {}, 1_000);
        `,
        { executionTimeout: 250, terminationGrace: 25 },
      );

      expect(res.outcome).to.eql('timed-out');
      expect(res.status?.signal).to.eql('SIGKILL');
      expect(res.termination.actions.map((action) => action.signal)).to.eql([
        'SIGTERM',
        'SIGKILL',
      ]);
    });

    it('pre-aborted signal → returns cancelled without child acquisition', async () => {
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

    it('abort after spawn → requests termination and returns cancelled', async () => {
      const controller = new AbortController();
      const running = captureEval(
        `setInterval(() => {}, 1_000);`,
        { signal: controller.signal, executionTimeout: 5_000, terminationGrace: 100 },
      );

      controller.abort();
      const res = await running;

      expect(res.outcome).to.eql('cancelled');
      expect(res.success).to.eql(false);
      expect(res.termination.reason).to.eql('cancelled');
      expect(res.termination.actions.map((action) => action.signal)[0]).to.eql('SIGTERM');
    });
  });

  describe('cleanup failure evidence', () => {
    it('stream acquisition failure → terminates the acquired child', async () => {
      const status = Promise.withResolvers<Deno.CommandStatus>();
      const signals: Deno.Signal[] = [];
      const stdout = new ReadableStream<Uint8Array>();
      const stderr = new ReadableStream<Uint8Array>();
      const externalReader = stderr.getReader();
      const child = fakeChild({
        status: status.promise,
        stdout,
        stderr,
        kill(signal) {
          signals.push(signal);
          status.resolve({ success: true, code: 0, signal });
        },
      });

      try {
        const res = requireFailed(
          await resolveWithin(
            captureWith(
              () => child,
              {
                args: [],
                terminationGrace: 1 as t.Msecs,
                ...DEFAULT_CAPS,
              },
              { streamTimeout: 1 as t.Msecs },
            ),
            100,
          ),
        );

        expect(res.failures[0].phases).to.eql(['setup']);
        expect(signals).to.eql(['SIGTERM']);
        expect(stdout.locked).to.eql(false);
      } finally {
        externalReader.releaseLock();
      }
    });

    it('status rejection → terminates the child and cancels both streams', async () => {
      const failure = new Error('capture:status');
      const status = Promise.withResolvers<Deno.CommandStatus>();
      const signals: Deno.Signal[] = [];
      const stdout = new ReadableStream<Uint8Array>();
      const stderr = new ReadableStream<Uint8Array>();
      const child = fakeChild({
        status: status.promise,
        stdout,
        stderr,
        kill: (signal) => signals.push(signal),
      });
      const output = captureWith(() => child, {
        args: [],
        terminationGrace: 1 as t.Msecs,
        ...DEFAULT_CAPS,
      });

      status.reject(failure);
      const res = requireFailed(await resolveWithin(output, 100));

      expect(res.failures.map((entry) => entry.error)).to.eql([failure]);
      expect(res.failures[0].phases).to.eql(['status']);
      expect(signals).to.eql(['SIGTERM', 'SIGKILL']);
      expect(stdout.locked).to.eql(false);
      expect(stderr.locked).to.eql(false);
    });

    it('signal failures → preserve causal order through bounded cleanup', async () => {
      const termFailure = new Error('capture:SIGTERM');
      const killFailure = new Error('capture:SIGKILL');
      const status = new Promise<Deno.CommandStatus>(() => undefined);
      const blockingStream = () =>
        new ReadableStream<Uint8Array>({
          cancel() {
            return new Promise<void>(() => undefined);
          },
        });
      const stdout = blockingStream();
      const stderr = blockingStream();
      const child = fakeChild({
        status,
        stdout,
        stderr,
        kill(signal) {
          throw signal === 'SIGTERM' ? termFailure : killFailure;
        },
      });

      const res = requireFailed(
        await resolveWithin(
          captureWith(
            () => child,
            {
              args: [],
              executionTimeout: 0 as t.Msecs,
              terminationGrace: 1 as t.Msecs,
              ...DEFAULT_CAPS,
            },
            {
              cleanupTimeout: 20 as t.Msecs,
              statusSettleTimeout: 1 as t.Msecs,
              streamTimeout: 1 as t.Msecs,
            },
          ),
          100,
        ),
      );

      expect(res.failures.slice(0, 3).map((entry) => entry.phases[0])).to.eql([
        'signal:SIGTERM',
        'signal:SIGKILL',
        'status:settle',
      ]);
      expect(res.failures[0].error).to.equal(termFailure);
      expect(res.failures[1].error).to.equal(killFailure);
      expect(res.error).to.be.instanceOf(AggregateError);
      if (!(res.error instanceof AggregateError)) throw res.error;
      expect(res.error.cause).to.equal(termFailure);
      expect(res.termination.reason).to.eql('timeout');
      expect(res.termination.forceTimedOut).to.eql(true);
      expect(stdout.locked).to.eql(false);
      expect(stderr.locked).to.eql(false);
    });

    it('termination and stream failures → preserve real-time causal order', async () => {
      const termFailure = new Error('capture:SIGTERM');
      const streamFailure = new Error('capture:stdout');
      const killFailure = new Error('capture:SIGKILL');
      const status = new Promise<Deno.CommandStatus>(() => undefined);
      let stdoutController: ReadableStreamDefaultController<Uint8Array> | undefined;
      const stdout = new ReadableStream<Uint8Array>({
        start(controller) {
          stdoutController = controller;
        },
      });
      const stderr = new ReadableStream<Uint8Array>();
      const child = fakeChild({
        status,
        stdout,
        stderr,
        kill(signal) {
          if (signal === 'SIGTERM') {
            queueMicrotask(() => stdoutController?.error(streamFailure));
            throw termFailure;
          }
          throw killFailure;
        },
      });

      const res = requireFailed(
        await resolveWithin(
          captureWith(
            () => child,
            {
              args: [],
              executionTimeout: 0 as t.Msecs,
              terminationGrace: 1 as t.Msecs,
              ...DEFAULT_CAPS,
            },
            {
              statusSettleTimeout: 1 as t.Msecs,
              streamTimeout: 1 as t.Msecs,
            },
          ),
          100,
        ),
      );

      expect(res.failures.slice(0, 4).map((entry) => entry.phases[0])).to.eql([
        'signal:SIGTERM',
        'stdout:read',
        'signal:SIGKILL',
        'status:settle',
      ]);
      expect(res.failures.slice(0, 3).map((entry) => entry.error)).to.eql([
        termFailure,
        streamFailure,
        killFailure,
      ]);
      expect(res.failures[1].phases).to.eql(['stdout:read', 'stdout:cancel']);
      expect(stdout.locked).to.eql(false);
      expect(stderr.locked).to.eql(false);
    });
  });

  describe('stream failure evidence', () => {
    it('one substrate failure → coalesces causal phases by error identity', async () => {
      const failure = new Error('capture:stdout');
      const status = Promise.withResolvers<Deno.CommandStatus>();
      const stdout = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.error(failure);
        },
      });
      const stderr = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.close();
        },
      });
      const child = fakeChild({
        status: status.promise,
        stdout,
        stderr,
        kill(signal) {
          status.resolve({ success: true, code: 0, signal });
        },
      });

      const res = requireFailed(
        await resolveWithin(
          captureWith(
            () => child,
            {
              args: [],
              terminationGrace: 1 as t.Msecs,
              ...DEFAULT_CAPS,
            },
            { streamTimeout: 1 as t.Msecs },
          ),
          100,
        ),
      );

      expect(res.failures.length).to.eql(1);
      expect(res.failures[0].error).to.equal(failure);
      expect(res.failures[0].phases).to.eql(['stdout:read', 'stdout:cancel']);
      expect(res.error).to.be.instanceOf(AggregateError);
      if (!(res.error instanceof AggregateError)) throw res.error;
      expect(res.error.errors).to.eql([failure]);
      expect(res.error.cause).to.equal(failure);
      expect(Reflect.get(res.error, 'failures')).to.eql(res.failures);
      expect(stdout.locked).to.eql(false);
      expect(stderr.locked).to.eql(false);
    });

    it('reader release failure → preserves raw identity in the failed result', async () => {
      const releaseFailure = new Error('capture:stdout-release');
      const status = Promise.withResolvers<Deno.CommandStatus>();
      let locked = true;
      const reader = {
        read: () => Promise.resolve({ done: true, value: undefined }),
        cancel() {
          locked = false;
          return Promise.resolve();
        },
        releaseLock() {
          locked = false;
          throw releaseFailure;
        },
      } as unknown as ReadableStreamDefaultReader<Uint8Array>;
      const stdout = {
        get locked() {
          return locked;
        },
        getReader: () => reader,
        cancel() {
          locked = false;
          return Promise.resolve();
        },
      } as unknown as ReadableStream<Uint8Array>;
      const stderr = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.close();
        },
      });
      const child = fakeChild({
        status: status.promise,
        stdout,
        stderr,
        kill(signal) {
          status.resolve({ success: true, code: 0, signal });
        },
      });

      const res = requireFailed(
        await resolveWithin(
          captureWith(
            () => child,
            { args: [], terminationGrace: 1 as t.Msecs, ...DEFAULT_CAPS },
          ),
          100,
        ),
      );

      expect(res.failures).to.eql([{ phases: ['stdout:release'], error: releaseFailure }]);
      expect(res.error).to.equal(releaseFailure);
      expect(stdout.locked).to.eql(false);
      expect(stderr.locked).to.eql(false);
    });

    it('clean child status → later stream read failure remains failed without signalling', async () => {
      const failure = new Error('capture:stdout-after-exit');
      const status = Promise.withResolvers<Deno.CommandStatus>();
      const signals: Deno.Signal[] = [];
      let stdoutController: ReadableStreamDefaultController<Uint8Array> | undefined;
      let stderrController: ReadableStreamDefaultController<Uint8Array> | undefined;
      const stdout = new ReadableStream<Uint8Array>({
        start(controller) {
          stdoutController = controller;
        },
      });
      const stderr = new ReadableStream<Uint8Array>({
        start(controller) {
          stderrController = controller;
        },
      });
      const child = fakeChild({
        status: status.promise,
        stdout,
        stderr,
        kill: (signal) => signals.push(signal),
      });
      const output = captureWith(() => child, {
        args: [],
        terminationGrace: 1 as t.Msecs,
        ...DEFAULT_CAPS,
      });

      status.resolve({ success: true, code: 0, signal: null });
      stdoutController?.error(failure);
      stderrController?.close();
      const res = requireFailed(await resolveWithin(output, 100));

      expect(res.status).to.eql({ success: true, code: 0, signal: null });
      expect(res.failures[0].error).to.equal(failure);
      expect(res.failures[0].phases[0]).to.eql('stdout:read');
      expect(signals).to.eql([]);
    });

    it('forced stream cancellation after clean status → preserves partial output as failure', async () => {
      const partial = new TextEncoder().encode('PARTIAL');
      const stdout = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(partial);
        },
      });
      const stderr = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.close();
        },
      });
      const child = fakeChild({
        status: Promise.resolve({ success: true, code: 0, signal: null }),
        stdout,
        stderr,
      });

      const res = requireFailed(
        await resolveWithin(
          captureWith(
            () => child,
            { args: [], terminationGrace: 1 as t.Msecs, ...DEFAULT_CAPS },
            { streamTimeout: 1 as t.Msecs },
          ),
          100,
        ),
      );

      expect(res.status).to.eql({ success: true, code: 0, signal: null });
      expect(res.text.stdout).to.eql('PARTIAL');
      expect(res.failures.map((entry) => entry.phases)).to.eql([['stdout:settle']]);
      expect(stdout.locked).to.eql(false);
      expect(stderr.locked).to.eql(false);
    });
  });
});

function requireFailed(output: t.Process.CaptureOutput): t.Process.CaptureFailedOutput {
  if (output.outcome !== 'failed') throw new Error(`Unexpected outcome: ${output.outcome}`);
  return output;
}

async function resolveWithin<T>(promise: Promise<T>, timeoutMs: number) {
  const deadline = Time.delay(timeoutMs);
  try {
    return await Promise.race([
      promise,
      deadline.then(() => {
        throw new Error(`Timed out after ${timeoutMs}ms.`);
      }),
    ]);
  } finally {
    deadline.cancel();
  }
}

function fakeChild(input: {
  status: Promise<Deno.CommandStatus>;
  stdout: ReadableStream<Uint8Array>;
  stderr: ReadableStream<Uint8Array>;
  kill?: (signal: Deno.Signal) => void;
}) {
  return {
    pid: 101,
    status: input.status,
    stdout: input.stdout,
    stderr: input.stderr,
    kill: input.kill ?? (() => undefined),
  } as unknown as Deno.ChildProcess;
}

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
