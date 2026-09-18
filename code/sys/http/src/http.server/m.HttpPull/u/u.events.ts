import { Rx, type t } from '../common.ts';

/** Create a hot, non-replaying view whose lifecycle owns only its subscription. */
export function eventView<T>(
  source$: t.Observable<T>,
  until?: t.UntilInput,
): t.Lifecycle & { readonly $: t.Observable<T> } {
  const life = Rx.lifecycle(until);
  const view$ = Rx.subject<T>();
  const subscription = source$.subscribe({
    next: (event) => view$.next(event),
    error: (error) => view$.error(error),
    complete: () => {
      view$.complete();
      if (!life.disposed) life.dispose('pull:complete');
    },
  });
  life.dispose$.subscribe(() => {
    subscription.unsubscribe();
    view$.complete();
  });
  return Rx.toLifecycle(life, { $: view$.asObservable() });
}
