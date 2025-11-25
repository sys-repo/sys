import type * as t from './t.ts';
import { Rx } from './libs.ts';

type Callback = (e: { life: t.Lifecycle }) => Promise<void> | void;

/**
 * Keep a long-running CLI process alive until disposed.
 *
 * Installs a SIGINT (Ctrl-C) handler, runs the optional callback with
 * the lifecycle, then blocks until `life.dispose()` is triggered.
 *
 * @example
 * await keepAlive(async (e) => {
 *   const server = await startMyServer();
 *
 *   e.life.dispose$.subscribe({
 *     complete: () => {
 *       server.close();
 *     },
 *   });
 * });
 */
export async function keepAlive(run?: Callback) {
  const life = Rx.lifecycle();
  const onSigint = () => life.dispose();

  Deno.addSignalListener('SIGINT', onSigint);

  try {
    if (run) await run({ life });

    // Block until disposal (completion of dispose$).
    await new Promise<void>((resolve) => {
      const sub = life.dispose$.subscribe({
        complete: () => {
          sub.unsubscribe?.();
          resolve();
        },
      });
    });
  } finally {
    Deno.removeSignalListener('SIGINT', onSigint);
    life.dispose(); // idempotent
  }
}
