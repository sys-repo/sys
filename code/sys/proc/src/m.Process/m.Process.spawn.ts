import { type t, c, rx } from './common.ts';
import { Wrangle, kill } from './u.ts';

type H = t.CmdProcessHandle;
type E = { source: t.StdStream; fn: t.CmdProcessEventHandler };

/**
 * Spawn a child process to run a <unix> command
 * and retrieve a streaming handle to monitor and control it.
 */
export const spawn: t.Proc['spawn'] = (config) => {
  const { silent } = config;
  const decoder = new TextDecoder();
  const life = rx.lifecycleAsync(config.dispose$, async () => {
    await stdoutReader.cancel();
    await stderrReader.cancel();
    await kill(child);
  });
  const $ = rx.subject<t.CmdProcessEvent>();
  const $$ = $.pipe(rx.takeUntil(life.dispose$));

  const command = Wrangle.command(config, { stdin: 'null' });
  const child = command.spawn();
  const pid = child.pid;

  const stdioHandlers = new Set<E>();
  const whenReadyHandlers = new Set<t.CmdProcessReadyHandler>();

  // Function to process output data chunks.
  const processOutput = (source: t.StdStream, data: Uint8Array) => {
    if (!silent) Deno.stdout.writeSync(data);
    let _text: undefined | string;
    const e: t.CmdProcessEvent = {
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
  let ready = false;
  let resolveWhenReady: (handle: H) => void;
  const whenReadyPromise = new Promise<H>((resolve) => {
    resolveWhenReady = (handle) => {
      const cmd = config.args.join(' ');
      const toString = toStringFactory({ pid, cmd });
      Array.from(whenReadyHandlers).forEach((fn) => fn({ pid, cmd, toString }));
      resolve(handle);
    };
  });
  const markAsReady = () => {
    if (ready) return;
    ready = true;
    resolveWhenReady(api);
  };

  /**
   * Monitor the STDIO streams.
   */
  const handleStream = async (
    kind: t.StdStream,
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
      return whenReadyPromise;
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
