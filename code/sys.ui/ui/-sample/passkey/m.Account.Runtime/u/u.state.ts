import { Obj, Rx, type t } from '../common.ts';

/** Only the readonly view crosses the runtime boundary; notifications carry no payload. */
export function createState() {
  const changed$ = Rx.subject<void>();
  let current: t.AccountRuntime.State.Snapshot = Obj.deepFreeze({
    lifecycle: 'inactive',
    browser: { kind: 'unchecked' },
    session: { kind: 'unknown' },
    operation: { kind: 'idle' },
  });
  const state: t.AccountRuntime.State = Object.freeze({
    get current() {
      return current;
    },
    get changed$() {
      return new Rx.Observable<void>((subscriber) => changed$.subscribe(subscriber));
    },
  });
  return {
    state,
    publish(patch: Partial<t.AccountRuntime.State.Snapshot>) {
      current = Obj.deepFreeze({ ...current, ...patch });
      changed$.next();
    },
    complete: () => changed$.complete(),
  };
}
