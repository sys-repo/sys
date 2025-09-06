import { type t, rx } from './common.ts';
import { stream } from './u.stream.ts';

export const stream$: t.HttpPullLib['stream$'] = (urls, dir, options = {}) => {
  const { until, ...rest } = options;
  const life = rx.lifecycle(until);
  const $ = rx.subject<t.HttpPullEvent>();

  // Create the generator explicitly so we can nudge it to end on dispose.
  const gen = stream(urls, dir, { ...rest, until: life });

  (async () => {
    try {
      for await (const ev of gen) {
        if (life.disposed) break;
        $.next(ev);
      }
      $.complete();
    } catch (err) {
      // stream() already treats cancellation quietly; surface only real errors:
      $.error(err);
    } finally {
      life.dispose();
    }
  })();

  // If the consumer cancels (life.dispose), end the generator promptly.
  const sub = life.dispose$.subscribe(() => {
    try {
      void (gen as any).return?.();
    } catch {}
    sub.unsubscribe();
  });

  return $.pipe(rx.takeUntil(life.dispose$));
};
