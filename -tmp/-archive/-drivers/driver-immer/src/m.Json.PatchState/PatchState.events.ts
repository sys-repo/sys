import { type t, rx, Immutable } from './common.ts';

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
  const patch$ = ob$.pipe(rx.takeUntil(life.dispose$));

  const $ = patch$.pipe(
    rx.map((e) => {
      const { before, after } = e;
      const patches = e.patches.next;
      return { before, after, patches } as t.ImmutableChange<T, P>;
    }),
  );

  const path = Immutable.Events.pathFilter<T, P>($, toPath);

  return {
    $,
    path,
    patch$,
    dispose: life.dispose,
    dispose$: life.dispose$,
    get disposed() {
      return life.disposed;
    },
  };
}

/**
 * Helpers:
 */
const toPath = (patch: P) => {
  const o = patch as { path: string };
  return 'path' in o ? Immutable.Patch.toObjectPath(o.path) : [];
};
