import { rx, type t } from './common.ts';
import { Wrangle, kill } from './u.ts';

type H = t.CmdProcessHandle;

/**
 * Spawn a child process to run a <unix> command
 * and retrieve a streaming handle to monitor and control it.
 */
export const spawn: t.Cmd['spawn'] = (config) => {
  const { silent } = config;
  const decoder = new TextDecoder();
  const life = rx.lifecycleAsync(config.dispose$, () => kill(child));
  const $ = rx.subject<t.CmdProcessEvent>();

  const command = Wrangle.command(config, { stdin: 'null' });
  const child = command.spawn();
  const pid = child.pid;

  const stdioHandlers = new Set<t.CmdProcessEventHandler>();
  const whenReadyHandlers = new Set<t.CmdProcessReadyHandler>();

  // Function to process output data chunks.
  const processOutput = (kind: t.StdStream, data: Uint8Array) => {
    if (!silent) Deno.stdout.writeSync(data);
    let _text: undefined | string;
    const e: t.CmdProcessEvent = {
      kind,
      data,
      toString: () => _text ?? (_text = decoder.decode(data)),
    };
    $.next(e);
    Array.from(stdioHandlers).forEach((fn) => fn(e));
  };

  /**
   * Readiness monitoring.
   */
  let ready = false;
  let resolveWhenReady: (handle: H) => void;
  const whenReadyPromise = new Promise<H>((resolve) => {
    resolveWhenReady = (handle) => {
      const cmd = config.args.join(' ');
      Array.from(whenReadyHandlers).forEach((fn) => fn({ pid, cmd }));
      resolve(handle);
    };
  });

  /**
   * Monitor the STDIO streams.
   */
  const handleStream = async (kind: t.StdStream, stream: ReadableStream<Uint8Array>) => {
    const reader = stream.getReader();
    try {
      while (true) {
        const res = await reader.read();
        if (res.done) break;
        processOutput(kind, res.value);
        if (!ready) {
          // Check for readiness on first data chunk.
          ready = true;
          resolveWhenReady(api);
        }
      }
    } finally {
      reader.releaseLock();
    }
  };
  handleStream('stdout', child.stdout);
  handleStream('stderr', child.stderr);

  /**
   * API
   */
  const api: H = {
    pid,
    $: $.asObservable(),

    get is() {
      return { ready };
    },
    whenReady(fn) {
      if (fn) whenReadyHandlers.add(fn);
      return whenReadyPromise;
    },

    onStdio(fn) {
      stdioHandlers.add(fn);
      return api;
    },

    /**
     * Lifecycle.
     */
    dispose: life.dispose,
    dispose$: life.dispose$,
    get disposed() {
      return life.disposed;
    },
  };

  return api;
};
