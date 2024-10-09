import { rx, type t } from './common';

type P = t.PatchOperation;
type O = Record<string, unknown>;

/**
 * Default [PatchState] event factory.
 */
export function defaultEvents<T extends O>(
  ob$: t.Observable<t.PatchChange<T>>,
  dispose$?: t.UntilObservable,
): t.PatchStateEvents<T> {
  const life = rx.lifecycle(dispose$);
  const $ = ob$.pipe(rx.takeUntil(life.dispose$));

  const changed$ = $.pipe(
    rx.map((e) => {
      const { before, after } = e;
      const patches = e.patches.next;
      return { before, after, patches } as t.ImmutableChange<T, P>;
    }),
  );

  return {
    $,
    changed$,
    dispose: life.dispose,
    dispose$: life.dispose$,
    get disposed() {
      return life.disposed;
    },
  };
}
