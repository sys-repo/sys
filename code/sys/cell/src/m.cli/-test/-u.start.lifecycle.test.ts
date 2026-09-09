import { describe, expect, Fs, it, Str, Testing, Time } from '../../-test.ts';
import { createShutdownSignal } from '../u.lifecycle/u.shutdown.ts';
import { loadStartCell, startCell } from '../u.lifecycle/u.start.ts';
import { CellSession } from '../u/u.session.ts';
import { cleanup, sessionRoot, spawnCellStart, withRuntimeDir } from './u.fixture.kill.ts';

type StartLifecycleGlobal = typeof globalThis & {
  __cellStartCloseFailure?: unknown;
  __cellStartCloseReasons?: unknown[];
  __cellStartOnClose?: () => void;
  __cellStartServiceFinished?: Promise<unknown>;
};

const state = globalThis as StartLifecycleGlobal;

describe('@sys/cell/cli start lifecycle', () => {
  it('ready-boundary presentation failure outranks an already-settled service', async () => {
    const cell = await holdingCell('CellCli.start.presentation-failure');
    const shutdown = createShutdownSignal();
    const cause = new Error('presentation-failed');
    let thrown: unknown;

    resetState();
    state.__cellStartServiceFinished = Promise.resolve('finished');
    try {
      await startCell(cell, {
        shutdown,
        onReady: () => shutdown.failPresentation(cause),
      });
    } catch (error) {
      thrown = error;
    } finally {
      shutdown.dispose();
    }

    expect(thrown).to.equal(cause);
    expect(state.__cellStartCloseReasons).to.eql([cause]);
    resetState();
  });

  it('keyboard interrupt closes running services without mapping process exit below the runner', async () => {
    const cell = await holdingCell('CellCli.start.keyboard-interrupt');
    const shutdown = createShutdownSignal();
    const previousExitCode = Deno.exitCode;

    resetState();
    Deno.exitCode = 0;
    try {
      const result = await startCell(cell, {
        shutdown,
        onReady: () => expect(shutdown.interrupt()).to.eql(true),
      });

      expect(result.services).to.eql(1);
      expect(shutdown.reason).to.eql('keyboard:interrupt');
      expect(state.__cellStartCloseReasons).to.eql(['keyboard:interrupt']);
      expect(Deno.exitCode).to.eql(0);
    } finally {
      Deno.exitCode = previousExitCode;
      shutdown.dispose();
      resetState();
    }
  });

  it('pre-ready interrupt remains terminal when service startup rejects its abort wrapper', async () => {
    const cell = await holdingCell('CellCli.start.pre-ready-interrupt');
    const shutdown = createShutdownSignal();
    const previousExitCode = Deno.exitCode;

    resetState();
    Deno.exitCode = 0;
    try {
      const result = await startCell(cell, {
        shutdown,
        onStarting: () => expect(shutdown.interrupt()).to.eql(true),
      });

      expect(result.services).to.eql(0);
      expect(shutdown.reason).to.eql('keyboard:interrupt');
      expect(state.__cellStartCloseReasons).to.eql([]);
      expect(Deno.exitCode).to.eql(0);
    } finally {
      Deno.exitCode = previousExitCode;
      shutdown.dispose();
      resetState();
    }
  });

  it('process SIGINT during delayed startup exits with code 130', async () => {
    const fixture = await processCell('CellCli.start.process-starting-interrupt', 'starting');
    const child = spawnCellStart(fixture.root, fixture.runtime);

    try {
      await waitForProcessSession(fixture.root, fixture.runtime, child.pid, 'starting');
      child.kill('SIGINT');
      const status = await child.status;
      expect(status.code).to.eql(130);
    } finally {
      await cleanup(child);
    }
  });

  it('process SIGINT retains code 130 when service cleanup also fails', async () => {
    const fixture = await processCell(
      'CellCli.start.process-interrupt-cleanup',
      'ready-fails-close',
    );
    const child = spawnCellStart(fixture.root, fixture.runtime);

    try {
      await waitForProcessSession(fixture.root, fixture.runtime, child.pid, 'ready');
      child.kill('SIGINT');
      const status = await child.status;
      expect(status.code).to.eql(130);
    } finally {
      await cleanup(child);
    }
  });

  it('service failure remains the terminal winner and close reason', async () => {
    const cell = await holdingCell('CellCli.start.service-failure');
    const shutdown = createShutdownSignal();
    const finished = Promise.withResolvers<never>();
    const cause = new Error('service-failed');
    let thrown: unknown;

    resetState();
    state.__cellStartServiceFinished = finished.promise;
    try {
      await startCell(cell, {
        shutdown,
        onReady: () => finished.reject(cause),
      });
    } catch (error) {
      thrown = error;
    } finally {
      shutdown.dispose();
    }

    expect(thrown).to.equal(cause);
    expect(state.__cellStartCloseReasons).to.eql([cause]);
    expect(shutdown.reason).to.eql(undefined);
    resetState();
  });

  it('service completion seals its close reason against late presentation failure', async () => {
    const cell = await holdingCell('CellCli.start.service-completion');
    const shutdown = createShutdownSignal();
    const lateCause = new Error('late-presentation-failed');
    let lateAccepted: boolean | undefined;

    resetState();
    state.__cellStartServiceFinished = Promise.resolve('finished');
    state.__cellStartOnClose = () => {
      lateAccepted = shutdown.failPresentation(lateCause);
    };
    try {
      const result = await startCell(cell, { shutdown });

      expect(result.services).to.eql(1);
      expect(lateAccepted).to.eql(false);
      expect(shutdown.reason).to.eql(undefined);
      expect(state.__cellStartCloseReasons).to.eql(['cell.start.finished']);
    } finally {
      shutdown.dispose();
      resetState();
    }
  });

  it('retains presentation failure as primary when service cleanup also fails', async () => {
    const cell = await holdingCell('CellCli.start.presentation-cleanup-failure');
    const shutdown = createShutdownSignal();
    const cause = new Error('presentation-failed');
    const closeFailure = new Error('service-close-failed');
    let thrown: unknown;

    resetState();
    state.__cellStartCloseFailure = closeFailure;
    try {
      await startCell(cell, {
        shutdown,
        onReady: () => shutdown.failPresentation(cause),
      });
    } catch (error) {
      thrown = error;
    } finally {
      shutdown.dispose();
    }

    expect(thrown instanceof AggregateError).to.eql(true);
    const aggregate = thrown as AggregateError;
    expect(aggregate.cause).to.equal(cause);
    expect(aggregate.errors).to.eql([cause, closeFailure]);
    expect(state.__cellStartCloseReasons).to.eql([cause]);
    resetState();
  });

  it('composes distinct session and service cleanup failures under the primary', async () => {
    const cell = await holdingCell('CellCli.start.session-cleanup-failures');
    const fs = await Testing.dir('CellCli.start.session-cleanup-runtime');
    const runtime = Fs.join(fs.dir, 'runtime');
    const shutdown = createShutdownSignal();
    const cause = new Error('presentation-failed');
    const closeFailure = new Error('service-close-failed');
    let thrown: unknown;

    resetState();
    state.__cellStartCloseFailure = closeFailure;
    await withRuntimeDir(runtime, async () => {
      try {
        await startCell(cell, {
          shutdown,
          onReady() {
            Deno.removeSync(runtime, { recursive: true });
            Deno.writeTextFileSync(runtime, 'blocked');
            shutdown.failPresentation(cause);
          },
        });
      } catch (error) {
        thrown = error;
      }
    });
    shutdown.dispose();

    expect(thrown instanceof AggregateError).to.eql(true);
    const aggregate = thrown as AggregateError;
    expect(aggregate.cause).to.equal(cause);
    expect(aggregate.errors[0]).to.equal(cause);
    expect(aggregate.errors).to.contain(closeFailure);
    expect(aggregate.errors.length).to.eql(4);
    expect(state.__cellStartCloseReasons).to.eql([cause]);
    resetState();
  });
});

async function holdingCell(name: string) {
  const fs = await Testing.dir(name);
  await Fs.write(
    Fs.join(fs.dir, '-config/@sys.cell/cell.yaml'),
    Str.dedent(`
      kind: cell
      version: 1

      services:
        - name: hold
          use: HoldingService
          from: ./-services/hold.ts
          config: ./-config/hold.yaml
    `).trimStart(),
  );
  await Fs.write(
    Fs.join(fs.dir, '-services/hold.ts'),
    Str.dedent(`
      export const HoldingService = {
        start(args: { until?: AbortSignal }) {
          const state = globalThis as unknown as {
            __cellStartCloseFailure?: unknown;
            __cellStartCloseReasons?: unknown[];
            __cellStartOnClose?: () => void;
            __cellStartServiceFinished?: Promise<unknown>;
          };
          const finished = state.__cellStartServiceFinished ?? new Promise<never>((_, reject) => {
            args.until?.addEventListener(
              'abort',
              () => reject(new Error('service-aborted')),
              { once: true },
            );
          });
          return {
            finished,
            close(reason: unknown) {
              state.__cellStartCloseReasons?.push(reason);
              state.__cellStartOnClose?.();
              if (state.__cellStartCloseFailure !== undefined) {
                throw state.__cellStartCloseFailure;
              }
            },
            status() {
              return { state: 'ready' };
            },
          };
        },
      };
    `).trimStart(),
  );
  return await loadStartCell(fs.dir);
}

async function processCell(
  name: string,
  mode: 'starting' | 'ready-fails-close',
) {
  const fs = await Testing.dir(name);
  const runtime = Fs.join(fs.dir, 'runtime');
  await Fs.write(
    Fs.join(fs.dir, '-config/@sys.cell/cell.yaml'),
    Str.dedent(`
      kind: cell
      version: 1

      services:
        - name: process
          use: ProcessService
          from: ./-services/process.ts
          config: ./-config/process.yaml
    `).trimStart(),
  );
  const start = mode === 'starting'
    ? Str.dedent(`
        return new Promise((_, reject) => {
          const abort = () => reject(args.until?.reason ?? new Error('startup-aborted'));
          if (args.until?.aborted) abort();
          else args.until?.addEventListener('abort', abort, { once: true });
        });
      `).trim()
    : Str.dedent(`
        const finished = new Promise((_, reject) => {
          const abort = () => reject(args.until?.reason ?? new Error('service-aborted'));
          if (args.until?.aborted) abort();
          else args.until?.addEventListener('abort', abort, { once: true });
        });
        return {
          finished,
          close() {
            throw new Error('service-close-failed');
          },
          status() {
            return { state: 'ready' };
          },
        };
      `).trim();
  await Fs.write(
    Fs.join(fs.dir, '-services/process.ts'),
    Str.dedent(`
      export const ProcessService = {
        start(args: { until?: AbortSignal }) {
          ${start}
        },
      };
    `).trimStart(),
  );
  return { root: fs.dir, runtime } as const;
}

async function waitForProcessSession(
  root: string,
  runtime: string,
  pid: number,
  state: CellSession.State,
) {
  const canonical = await sessionRoot(root);
  return await Time.waitFor(async () => {
    const sessions = await CellSession.list(canonical, { dir: runtime });
    return sessions.find((session) => session.pid === pid && session.state === state);
  }, { interval: 25, timeout: 5_000 });
}

function resetState() {
  delete state.__cellStartCloseFailure;
  delete state.__cellStartOnClose;
  delete state.__cellStartServiceFinished;
  state.__cellStartCloseReasons = [];
}
