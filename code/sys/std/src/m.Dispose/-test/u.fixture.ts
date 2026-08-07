import { Arr, Is, type t } from './common.ts';

/** Triggers every controllable disposal input in a test fixture. */
export function triggerUntil(until?: t.DisposeInput) {
  if (Is.disposable(until)) return until.dispose();
  if (Is.subject(until)) return until.next(undefined);
  if (!Is.array(until)) return;

  Arr.flatten<unknown>(until).forEach((item) => {
    if (Is.disposable(item)) item.dispose();
    else if (Is.subject(item)) item.next(undefined);
  });
}
