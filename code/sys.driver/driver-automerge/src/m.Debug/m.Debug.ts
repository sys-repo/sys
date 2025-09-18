import { type t, A } from './common.ts';
import { Reentry } from './m.Reentry.ts';

/** Track whether tripwire patch was applied. */
let tripwireInstalled = false;
type TripwireMode = 'off' | 'patched' | 'fallback';
let tripwireMode: TripwireMode = 'off';

const unwrapDoc = (doc: unknown) => (doc as any)?.doc ?? doc;

const warnTrip = (where: string) => {
  console.warn('[tripwire] getHeads during Automerge callback', {
    labels: Reentry.labels(),
    stack: new Error().stack,
    mode: tripwireMode,
    where,
  });
};

export const Debug: t.DebugLib = {
  Reentry,

  installTripwireGetHeads(enable) {
    if (!enable || tripwireInstalled) return;
    tripwireInstalled = true;

    try {
      // Patched mode: wrap A.getHeads.
      const real = A.getHeads as (doc: unknown) => readonly string[];
      tripwireMode = 'patched';
      (A as any).getHeads = (doc: unknown) => {
        if (Reentry.inCallback()) warnTrip('A.getHeads');
        return real(unwrapDoc(doc));
      };
    } catch {
      // Fallback mode: cannot patch ESM export.
      tripwireMode = 'fallback';
      console.warn('[tripwire] falling back (A.getHeads is read-only ESM export)');
    }
  },

  defer(fn) {
    queueMicrotask(fn);
  },

  coalesce(): t.Scheduler {
    let queued = false;
    return (fn: () => void) => {
      if (queued) return;
      queued = true;
      queueMicrotask(() => {
        queued = false;
        fn();
      });
    };
  },

  getHeadsSafe(doc): t.Heads {
    if (Reentry.inCallback()) {
      if (tripwireMode === 'fallback') warnTrip('Debug.getHeadsSafe');
      throw new Error('getHeadsSafe: called during Automerge callback');
    }
    return A.getHeads(unwrapDoc(doc));
  },

  getHeadsDeferred(doc, use) {
    const d = unwrapDoc(doc);
    if (Reentry.inCallback() && tripwireMode === 'fallback') warnTrip('Debug.getHeadsDeferred');
    queueMicrotask(() => use(A.getHeads(d)));
  },

  guardDocAccess<T>(doc: T): T {
    if (doc === null || typeof doc !== 'object') return doc;
    return new Proxy(doc as object, {
      get(target, prop, receiver) {
        if (Reentry.inCallback()) {
          throw new Error('Debug.guardDocAccess: object accessed during Automerge callback');
        }
        return Reflect.get(target, prop, receiver);
      },
    }) as T;
  },
};
