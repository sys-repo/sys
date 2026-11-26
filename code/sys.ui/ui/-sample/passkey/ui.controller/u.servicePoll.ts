import { Rx, Time } from '../common.ts';
import type { t } from '../ui/common.ts';

const delay = 5_000;
const initial = Object.freeze({ kind: 'not-observed' } as const);
const failed = Object.freeze({ kind: 'failed' } as const);

/** One owner's service observation. The host decides when it is eligible to poll. */
export function createServicePoll(
  readCounts: t.AccountRuntime.Info['readCounts'],
  wait: (delay: t.Msecs, signal: AbortSignal) => Promise<void> = Time.wait,
) {
  const changed$ = Rx.subject<void>();
  let current: t.Passkey.ServiceObservation = initial;
  let cycle: AbortController | undefined;
  let disposed = false;

  const service: Pick<t.Controller.Service, 'current' | 'subscribe'> = {
    current: () => current,
    subscribe(notify) {
      const sub = changed$.subscribe(notify);
      return () => sub.unsubscribe();
    },
  };
  return { service, resume, pause, reset, dispose };

  function resume() {
    if (disposed || cycle) return;
    cycle = new AbortController();
    void poll(cycle.signal);
  }

  function pause() {
    const previous = cycle;
    cycle = undefined;
    previous?.abort();
  }

  function reset() {
    pause();
    publish(initial);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    reset();
    changed$.complete();
  }

  function publish(next: t.Passkey.ServiceObservation) {
    if (current === next) return;
    current = next;
    changed$.next();
  }

  async function poll(signal: AbortSignal) {
    while (!signal.aborted) {
      const counts = await readCounts(signal);
      if (signal.aborted) return;
      publish(counts ? Object.freeze({ kind: 'observed', counts }) : failed);
      if (!signal.aborted) await wait(delay, signal);
    }
  }
}
