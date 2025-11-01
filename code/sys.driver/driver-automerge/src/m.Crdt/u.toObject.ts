import { type t, A } from './common.ts';
import { CrdtIs } from './m.Is.ts';

type O = Record<string, unknown>;

export const toObject: t.CrdtToObject = <T extends O>(input?: t.Crdt.Ref<T> | T): T => {
  if (input == null) return {} as T;

  const ref = CrdtIs.ref<T>(input) ? (input as t.Crdt.Ref<T>) : undefined;
  const value = ref ? ref.current : (input as T);

  // const AM: any = A as any;
  const hasToJS = typeof A?.toJS === 'function';
  const isA = typeof A?.getObjectId === 'function' ? !!A.getObjectId(value) : false;

  if (hasToJS && (ref || isA)) {
    try {
      return A.toJS(value) as T; // materialize AM proxy/root
    } catch {
      // fall through to return the plain value
    }
  }

  // Plain JS object (no AM proxies detected).
  return value as T;
};
