import { rx, type t } from './common.ts';
import { Wrangle, kill } from './u.ts';

/**
 * Spawn a child process to run a <unix> command
 * and retrieve a streaming handle to monitor and control it.
 */
export const spawn: t.Cmd['spawn'] = (input) => {
  const { silent } = input;
  const life = rx.lifecycleAsync(input.dispose$, () => kill(child));
  const decoder = new TextDecoder();

  const $ = rx.subject<t.CmdProcessEvent>();
  const command = Wrangle.command(input, { stdin: 'null' });
  const child = command.spawn();
  const pid = child.pid;
  const handlers = new Set<t.CmdProcessEventHandler>();

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
    Array.from(handlers).forEach((fn) => fn(e));
  };

  /**
   * Readiness monitoring.
   */
  let ready = false;
  let resolveWhenReady: () => void;
  const whenReadyPromise = new Promise<void>((resolve) => (resolveWhenReady = resolve));

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
          resolveWhenReady();
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
  const api: t.CmdProcessHandle = {
    pid,
    $: $.asObservable(),

    get is() {
      return { ready };
    },
    whenReady() {
      return whenReadyPromise;
    },

    onStdio(fn) {
      handlers.add(fn);
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
