import { viaObservable, curryChangeFunction } from './Immutable.events.ts';
import { R, rx, slug, type t } from './common.ts';
import { Wrangle } from './u.ts';

/**
 * Change Patch Standard:
 *    RFC-6902 JSON patch standard
 *    https://tools.ietf.org/html/rfc6902
 */
type P = t.PatchOperation;

/**
 * A simple Immutable<T> implementation using brute-force cloning.
 * NOTE:
 *    This is simple, BUT NOT performant on large objects.
 */
export function cloner<T>(
  initial: T,
  options: { clone?: <T>(input: T) => T } = {},
): t.Immutable<T, P> {
  const { clone = R.clone } = options;
  let _current = clone(initial);
  return {
    get current() {
      return _current;
    },
    change(fn, options) {
      const prev = _current;
      const next = clone(_current);
      fn(next);
      _current = next;
      Wrangle.options(options).patches?.(Wrangle.patches(prev, next));
    },
  };
}

/**
 * A simple ImmutableRef<T> implementation using brute-force cloning.
 * NB:
 *    This is simple, BUT NOT performant on large objects.
 * NB:
 *    This is used as the default Immutable structure for the [sys.cmd]
 *    <Cmd> system unit tests.
 */
export function clonerRef<T>(initial: T, options: { clone?: <T>(input: T) => T } = {}) {
  type E = t.ImmutableEvents<T, P>;
  type R = t.ImmutableRef<T, P, E>;
  const $ = rx.subject<t.ImmutableChange<T, P>>();
  const inner = cloner<T>(initial, options);
  const api: R = {
    instance: slug(),
    get current() {
      return inner.current;
    },
    change: curryChangeFunction<T, P>($, inner.change, () => inner.current),
    events: (dispose$?: t.UntilObservable) => viaObservable<T, P>($, dispose$),
  };
  return api;
}
