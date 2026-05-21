import type { t } from './common.ts';
import { create } from './u.create.ts';

/** Hosted startup convenience over `create`, with optional host-process lifecycle wiring. */
export function start<
  N extends string = t.Cmd.Name,
  P extends t.Cmd.Payload.Map<N> = t.Cmd.Payload.Map<N>,
  R extends t.Cmd.Result.Map<N> = t.Cmd.Result.Map<N>,
  E extends t.Cmd.Event.Map<N> = t.Cmd.Event.Map<N>,
>(input: t.WebSocketServer.StartOptions<N, P, R, E>): t.WebSocketServer.Started {
  const lifecycle = input.lifecycle ?? 'manual';
  const server = create<N, P, R, E>(input);

  if (lifecycle === 'process') bindProcessLifecycle(server);
  return server;
}

/**
 * Helpers:
 */
function bindProcessLifecycle(server: t.WebSocketServer.Started) {
  const added: Array<{ readonly signal: Deno.Signal; readonly handler: () => void }> = [];

  const add = (signal: Deno.Signal) => {
    const handler = () => {
      void Promise.resolve(server.close(`signal:${signal}`)).catch(() => undefined);
    };
    try {
      Deno.addSignalListener(signal, handler);
      added.push({ signal, handler });
    } catch {
      // Some runtimes/platforms do not support all signals. Keep lifecycle binding best-effort.
    }
  };

  const cleanup = () => {
    while (added.length > 0) {
      const entry = added.pop();
      if (!entry) continue;
      try {
        Deno.removeSignalListener(entry.signal, entry.handler);
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
