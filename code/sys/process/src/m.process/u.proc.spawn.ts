import { c, Rx, type t } from './common.ts';
import { asCommand, kill } from './u.ts';

type H = t.Process.Handle;
type E = { source: t.Process.StdStream; fn: t.Process.EventHandler };
type ReadyWaiter = { resolve(handle: H): void; reject(cause: Error): void };

/**
 * Spawn a child process to run a <unix> command
 * and retrieve a streaming handle to monitor and control it.
 */
export const spawn: t.Process.Lib['spawn'] = (config) => {
  const { silent } = config;
  const decoder = new TextDecoder();
  const life = Rx.lifecycleAsync(config.until, async () => {
    await stdoutReader.cancel();
    await stderrReader.cancel();
    await kill(child);
  });
  const $ = Rx.subject<t.Process.Event>();
  const $$ = $.pipe(Rx.takeUntil(life.dispose$));

  const command = asCommand(config, { stdin: 'null' });
  const child = command.spawn();
  const pid = child.pid;

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
  const handleStream = async (
    kind: t.Process.StdStream,
    reader: ReadableStreamDefaultReader<Uint8Array>,
  ) => {
    try {
      while (true) {
        const res = await reader.read();
        if (res.done) break;

        const e = processOutput(kind, res.value);

        if (!ready) {
          const { readySignal } = config;
          if (readySignal === undefined) markAsReady();
          if (typeof readySignal === 'string' && e.toString() === `${readySignal}\n`) markAsReady();
          if (typeof readySignal === 'function' && readySignal(e)) markAsReady();
        }
      }
    } finally {
      reader.releaseLock();
    }
  };

  const stdoutReader = child.stdout.getReader();
  const stderrReader = child.stderr.getReader();
  handleStream('stdout', stdoutReader);
  handleStream('stderr', stderrReader);
  child.status.then(
    (status) => {
      if (!ready) rejectWhenReady(childExitedBeforeReadyError({ pid, cmd, status }));
    },
    (cause) => {
      if (!ready) rejectWhenReady(childStatusFailedBeforeReadyError({ pid, cmd, cause }));
    },
  );
  life.dispose$.subscribe((e) => {
    if (e.payload.stage === 'start' && !ready) {
      rejectWhenReady(disposedBeforeReadyError({ pid, cmd, reason: e.payload.reason }));
    }
  });

  /**
   * API
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
    dispose: life.dispose,
    get dispose$() {
      return life.dispose$;
    },
    get disposed() {
      return life.disposed;
    },
  };

  return api;
};

/**
 * Helpers
 */
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
  return new Error(`Process.spawn: disposed before ready: pid=${pid} cmd=${cmd}`, { cause: reason });
}
