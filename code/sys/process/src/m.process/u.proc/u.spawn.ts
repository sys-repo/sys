import { c, Rx, type t } from '../common.ts';
import { asCommand, kill } from '../u/u.ts';

type H = t.Process.Handle;
type E = { source: t.Process.StdStream; fn: t.Process.EventHandler };
type ReadyWaiter = { resolve(handle: H): void; reject(cause: Error): void };
type StreamReader = ReadableStreamDefaultReader<Uint8Array>;

/**
 * Spawn a child process to run a <unix> command
 * and retrieve a streaming handle to monitor and control it.
 */
export const spawn: t.Process.Lib['spawn'] = (config) => {
  const { silent } = config;
  const decoder = new TextDecoder();
  const $ = Rx.subject<t.Process.Event>();

  let child: Deno.ChildProcess | undefined;
  let stdoutReader: StreamReader | undefined;
  let stderrReader: StreamReader | undefined;
  let stdoutPump: Promise<void> | undefined;
  let stderrPump: Promise<void> | undefined;
  let life: t.LifecycleAsync | undefined;

  const cleanup = async () => {
    const outcomes = await Promise.allSettled([
      stopReader(stdoutReader, stdoutPump),
      stopReader(stderrReader, stderrPump),
      child ? kill(child) : Promise.resolve(),
    ]);
    const failure = outcomes.find((outcome) => outcome.status === 'rejected');
    if (failure?.status === 'rejected') throw failure.reason;
  };

  try {
    const command = asCommand(config, { stdin: 'null' });
    child = command.spawn();
    const pid = child.pid;

    stdoutReader = child.stdout.getReader();
    stderrReader = child.stderr.getReader();

    const lifecycle = Rx.lifecycleAsync(config.until, cleanup);
    life = lifecycle;
    const $$ = $.pipe(Rx.takeUntil(lifecycle.dispose$));

    const stdioHandlers = new Set<E>();
    const whenReadyHandlers = new Set<t.Process.ReadyHandler>();

    // Function to process output data chunks.
    const processOutput = (source: t.Process.StdStream, data: Uint8Array) => {
      if (!silent) Deno.stdout.writeSync(data);
      let _text: undefined | string;
      const e: t.Process.Event = {
        source,
        data,
        toString: () => _text ?? (_text = decoder.decode(data)),
      };
      $.next(e);
      Array.from(stdioHandlers)
        .filter((item) => item.source === source)
        .forEach((item) => item.fn(e));
      return e;
    };

    /**
     * Readiness monitoring.
     */
    const cmd = config.args.join(' ');
    const readyWaiters = new Set<ReadyWaiter>();
    let ready = false;
    let readyFailure: Error | undefined;
    const markAsReady = () => {
      if (ready || readyFailure) return;
      ready = true;
      const toString = toStringFactory({ pid, cmd });
      Array.from(whenReadyHandlers).forEach((fn) => fn({ pid, cmd, toString }));
      Array.from(readyWaiters).forEach((waiter) => waiter.resolve(api));
      readyWaiters.clear();
    };
    const rejectWhenReady = (cause: Error) => {
      if (ready || readyFailure) return;
      readyFailure = cause;
      Array.from(readyWaiters).forEach((waiter) => waiter.reject(cause));
      readyWaiters.clear();
    };

    /**
     * Monitor the STDIO streams.
     */
    const handleStream = async (kind: t.Process.StdStream, reader: StreamReader) => {
      try {
        while (true) {
          const res = await reader.read();
          if (res.done) break;

          const e = processOutput(kind, res.value);

          if (!ready) {
            const { readySignal } = config;
            if (readySignal === undefined) markAsReady();
            if (typeof readySignal === 'string' && e.toString() === `${readySignal}\n`) {
              markAsReady();
            }
            if (typeof readySignal === 'function' && readySignal(e)) markAsReady();
          }
        }
      } finally {
        reader.releaseLock();
      }
    };

    /**
     * API:
     */
    const api: H = {
      pid,
      get $() {
        return $$;
      },

      get is() {
        return { ready };
      },
      whenReady(fn) {
        if (fn) whenReadyHandlers.add(fn);
        if (ready) return Promise.resolve(api);
        if (readyFailure) return Promise.reject(readyFailure);
        return new Promise<H>((resolve, reject) => {
          readyWaiters.add({ resolve, reject });
        });
      },

      onStdOut(fn) {
        stdioHandlers.add({ fn, source: 'stdout' });
        return api;
      },

      onStdErr(fn) {
        stdioHandlers.add({ fn, source: 'stderr' });
        return api;
      },

      /**
       * Lifecycle.
       */
      dispose: lifecycle.dispose,
      [Symbol.asyncDispose]: lifecycle[Symbol.asyncDispose],
      get dispose$() {
        return lifecycle.dispose$;
      },
      get disposed() {
        return lifecycle.disposed;
      },
    };

    lifecycle.dispose$.subscribe((e) => {
      if (e.payload.stage === 'start' && !ready) {
        rejectWhenReady(disposedBeforeReadyError({ pid, cmd, reason: e.payload.reason }));
      }
    });

    stdoutPump = handleStream('stdout', stdoutReader);
    stderrPump = handleStream('stderr', stderrReader);
    child.status.then(
      (status) => {
        if (!ready) rejectWhenReady(childExitedBeforeReadyError({ pid, cmd, status }));
      },
      (cause) => {
        if (!ready) rejectWhenReady(childStatusFailedBeforeReadyError({ pid, cmd, cause }));
      },
    );

    return api;
  } catch (error) {
    const rollback = life ? life.dispose(error) : cleanup();
    void rollback.catch(() => undefined);
    throw error;
  }
};

/**
 * Helpers:
 */
async function stopReader(reader?: StreamReader, pump?: Promise<void>) {
  if (!reader) return;

  try {
    await reader.cancel();
  } finally {
    if (pump) await pump;
    else reader.releaseLock();
  }
}

function toStringFactory(args: { pid: number; cmd: string }) {
  const { pid, cmd } = args;
  return () => {
    return `
process ${c.gray('pid:')}${c.green(String(pid))}
${c.gray(cmd)}
`.substring(1);
  };
}

function childExitedBeforeReadyError(args: {
  pid: number;
  cmd: string;
  status: Deno.CommandStatus;
}) {
  const { pid, cmd, status } = args;
  const signal = status.signal ? ` signal=${status.signal}` : '';
  return new Error(
    `Process.spawn: child exited before ready: pid=${pid} code=${status.code}${signal} cmd=${cmd}`,
  );
}

function childStatusFailedBeforeReadyError(args: { pid: number; cmd: string; cause: unknown }) {
  const { pid, cmd, cause } = args;
  return new Error(`Process.spawn: failed waiting for child before ready: pid=${pid} cmd=${cmd}`, {
    cause,
  });
}

function disposedBeforeReadyError(args: { pid: number; cmd: string; reason: unknown }) {
  const { pid, cmd, reason } = args;
  return new Error(`Process.spawn: disposed before ready: pid=${pid} cmd=${cmd}`, {
    cause: reason,
  });
}
