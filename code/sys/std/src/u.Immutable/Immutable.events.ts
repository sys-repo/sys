import { rx, type t } from './common.ts';
import { Wrangle } from './u.ts';

/**
 * Change Patch Standard:
 *    RFC-6902 JSON patch standard
 *    https://tools.ietf.org/html/rfc6902
 */
type DefaultPatch = t.PatchOperation;

/**
 * ImmutableEvents<T> structure.
 */
export function viaObservable<T, P = DefaultPatch>(
  $: t.Observable<t.ImmutableChange<T, P>>,
  dispose$?: t.UntilObservable,
): t.ImmutableEvents<T, P> {
  const life = rx.lifecycle(dispose$);
  return {
    changed$: $.pipe(rx.takeUntil(life.dispose$)),
    dispose: life.dispose,
    dispose$: life.dispose$,
    get disposed() {
      return life.disposed;
    },
  };
}

/**
 * Generic events for an Immutable<T> object
 * achieved by overriding the [change] method.
 */
export function viaOverride<T, P = DefaultPatch>(
  source: t.Immutable<T, P>,
  dispose$?: t.UntilObservable,
): t.ImmutableEvents<T, P> {
  const $ = rx.subject<t.ImmutableChange<T, P>>();
  const api = viaObservable<T, P>($, dispose$);
  const base = source.change;
  api.dispose$.subscribe(() => (source.change = base));
  source.change = curryChangeFunction<T, P>($, base, () => source.current);
  return api;
}

/**
 * Implementation for a override function for [Immutable.change].
 */
export function curryChangeFunction<T, P = DefaultPatch>(
  $: t.Subject<t.ImmutableChange<T, P>>,
  change: t.Immutable<T, P>['change'],
  current: () => T,
): t.Immutable<T, P>['change'] {
  return (fn, options) => {
    const before = current();
    const callback = Wrangle.options(options).patches;
    let patches: P[] = [];
    change(fn, {
      ...options,
      patches(e) {
        patches = e;
        callback?.(e);
      },
    });
    const after = current();
    $.next({ before, after, patches });
  };
}
