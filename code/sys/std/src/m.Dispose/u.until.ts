import { type t, Arr, Is } from './common.ts';

/**
 * Listens to an observable (or set of observbles) and
 * disposes of the target when any of them fire.
 */
export function until(input?: t.DisposeInput) {
  if (Is.disposable(input)) return [input.dispose$];

  const $ = input;
  const list = Array.isArray($) ? $ : [$];

  return Arr.flatten<unknown>(list)
    .filter(Boolean)
    .map((m) => (Is.disposable(m) ? m.dispose$ : m)) as t.Observable<unknown>[];
}
