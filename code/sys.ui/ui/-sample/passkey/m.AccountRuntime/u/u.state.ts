import { Obj, Rx, type t } from '../common.ts';

/** Only the readonly view crosses the runtime boundary; notifications carry no payload. */
export function createState() {
  const changed = Rx.subject();
  let current: t.AccountRuntime.Snapshot = Obj.deepFreeze({
    lifecycle: 'inactive',
    browser: { kind: 'unchecked' },
    session: { kind: 'unknown' },
    operation: { kind: 'idle' },
  });
  const state: t.AccountRuntime.State = Object.freeze({
    get current() {
      return current;
    },
    get changes$() {
      return new Rx.Observable<void>((subscriber) => changed.subscribe(subscriber));
    },
  });
  return {
    state,
    publish(patch: Partial<t.AccountRuntime.Snapshot>) {
      current = Obj.deepFreeze({ ...current, ...patch });
      changed.next();
    },
    complete: () => changed.complete(),
  };
}
