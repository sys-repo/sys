import { type t, flatten, Is } from './common.ts';

/**
 * Listens to an observable (or set of observbles) and
 * disposes of the target when any of them fire.
 */
export function until(input?: t.DisposeInput) {
  if (Is.disposable(input)) {
    return [input.dispose$];
  } else {
    const $ = input;
    const list = Array.isArray($) ? $ : [$];
    return flatten(list)
      .filter(Boolean)
      .map((m) => (Is.disposable(m) ? m.dispose$ : m)) as t.Observable<unknown>[];
  }
}
