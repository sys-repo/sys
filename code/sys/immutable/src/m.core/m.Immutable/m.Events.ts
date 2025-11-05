import { type t, Rx } from './common.ts';
import { pathFilter } from './m.Events.path.ts';
import { Patch } from './m.Patch.ts';
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
  input$: t.Observable<t.ImmutableChange<T, P>>,
  dispose$?: t.UntilInput,
): t.ImmutableEvents<T, P> {
  const life = Rx.lifecycle(dispose$);
  const $ = input$.pipe(Rx.takeUntil(life.dispose$));
  const toPath = (patch: P) => {
    const o = patch as { path: string };
    return 'path' in o ? Patch.toObjectPath(o.path) : [];
  };
  const path = pathFilter<T, P>($, toPath);
  return Rx.toLifecycle<t.ImmutableEvents<T, P>>(life, { $, path });
}

/**
 * Generic events for an Immutable<T> object
 * achieved by overriding the [change] method.
 */
export function viaOverride<T, P = DefaultPatch>(
  source: t.Immutable<T, P>,
  dispose$?: t.UntilInput,
): t.ImmutableEvents<T, P> {
  const $ = Rx.subject<t.ImmutableChange<T, P>>();
  const api = viaObservable<T, P>($, dispose$);
  const base = source.change;
  api.dispose$.subscribe(() => (source.change = base));
  source.change = curryChangeFunction<T, P>($, base, () => source.current);
  return api;
}

/**
 * Implementation for an override function for [Immutable.change].
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

/**
 * Library:
 */
export const Events: t.ImmutableEventsLib = {
  viaOverride,
  viaObservable,
  pathFilter,
};
