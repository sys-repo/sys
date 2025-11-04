import type { t } from '../common.ts';
import { Rx } from './libs.ts';

type Callback = (until: t.UntilObservable) => Promise<void> | void;

export async function keepAlive(run?: Callback) {
  const life = Rx.lifecycle(); // emits and completes on dispose
  const onSigint = () => life.dispose();

  Deno.addSignalListener('SIGINT', onSigint);
  try {
    if (run) await run(life.dispose$);

    // Block until disposed (Ctrl-C or caller-driven):
    await new Promise<void>((resolve) => {
      const sub = life.dispose$.subscribe(() => {
        sub.unsubscribe?.();
        resolve();
      });
    });
  } finally {
    Deno.removeSignalListener('SIGINT', onSigint);
    life.dispose(); // idempotent
  }
}
