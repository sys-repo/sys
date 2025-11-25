import { Rx } from './libs.ts';

/**
 * Keep a long-running CLI process alive until disposed.
 *
 * Installs a SIGINT (Ctrl-C) handler, runs the optional callback with
 * the lifecycle, then blocks until `life.dispose()` is triggered.
 */
export async function keepAlive(exitCode = 0) {
  const life = Rx.lifecycle();
  const onSigint = () => life.dispose();

  Deno.addSignalListener('SIGINT', onSigint);

  try {
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
    life.dispose(); // safe to call again
  }

  // Now that we've signalled shutdown to the rest of the system,
  // actually terminate the process.
  Deno.exit(exitCode);
}
