import { Process, type t } from '../common.ts';
import { create } from './u.create.ts';
import { printStarted } from './u.fmt.ts';
import { bindKeyboard } from './u.keyboard.ts';

/** Hosted startup convenience over `create`, with optional host-process lifecycle wiring. */
export const start: t.WebSocketServer.Lib['start'] = (input) => startWith(input, Process.Signal.on);

/** Internal startup seam for exercising process lifecycle without native signal delivery. */
export function startWith<
  N extends string = t.Cmd.Name,
  P extends t.Cmd.Payload.Map<N> = t.Cmd.Payload.Map<N>,
  R extends t.Cmd.Result.Map<N> = t.Cmd.Result.Map<N>,
  E extends t.Cmd.Event.Map<N> = t.Cmd.Event.Map<N>,
>(
  input: t.WebSocketServer.StartOptions<N, P, R, E>,
  onSignal: t.Process.Signal.Lib['on'],
): t.WebSocketServer.Started {
  const { lifecycle = 'manual', silent, keyboard: keyboardInput, ...createOptions } = input;
  let keyboard = false;
  const server = create<N, P, R, E>(createOptions, {
    bindKeyboard(server) {
      const owner = bindKeyboard(server, keyboardInput);
      keyboard = owner !== undefined;
      return owner;
    },
  });

  try {
    if (lifecycle === 'process') bindProcessLifecycle(server, onSignal);
    if (!silent) printStarted(server, { lifecycle, keyboard });
    return server;
  } catch (cause) {
    const close = async () => void await server.close(cause);
    void close().catch(() => undefined);
    throw cause;
  }
}

/**
 * Helpers:
 */
function bindProcessLifecycle(
  server: t.WebSocketServer.Started,
  onSignal: t.Process.Signal.Lib['on'],
) {
  const disposers: Array<() => void> = [];

  const add = (signal: t.Process.Signal.Name) => {
    const handler = () => {
      void Promise.resolve(server.close(`signal:${signal}`)).catch(() => undefined);
    };
    try {
      const subscription = onSignal(signal, handler);
      if (subscription.kind === 'attached') disposers.push(subscription.dispose);
    } catch {
      // Some runtimes/platforms do not support all signals. Keep lifecycle binding best-effort.
    }
  };

  const cleanup = () => {
    for (const dispose of disposers.splice(0).reverse()) {
      try {
        dispose();
      } catch {
        // Ignore cleanup failures; the server lifecycle remains authoritative.
      }
    }
  };

  add('SIGINT');
  add('SIGTERM');

  server.dispose$.subscribe((e) => {
    if (e.payload.stage === 'complete' || e.payload.stage === 'error') cleanup();
  });
  void server.finished.then(cleanup, cleanup);
}
