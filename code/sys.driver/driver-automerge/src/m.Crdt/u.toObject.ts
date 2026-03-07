import { type t, A } from './common.ts';
import { CrdtIs } from './m.Is.ts';

type O = Record<string, unknown>;

/**
 * Convert a CRDT-backed value into a plain JS object (POJO).
 */
export const toObject: t.CrdtToObject = <T extends O>(input?: t.Crdt.Ref<T> | T | unknown): T => {
  if (input == null) return {} as T;

  const ref = CrdtIs.ref<T>(input) ? (input as t.Crdt.Ref<T>) : undefined;
  const value = ref ? ref.current : (input as T);

  // Fast path: root doc → Automerge.toJS
  // const AM: any = Automerge as any;
  const hasToJS = typeof A?.toJS === 'function';
  if (ref && hasToJS) {
    return A.toJS(value) as T;
  }

  // Nested AM proxies: deep-strip proxies
  if (isAM(value)) {
    return toPlainDeep(value) as T;
  }

  // Plain inputs: return as-is (identity)
  return value as T;
};

/**
 * Helpers:
 */
const isAM = (v: unknown) => {
  return typeof A?.getObjectId === 'function' ? !!A.getObjectId(v) : false;
};

const isAMText = (x: unknown) =>
  !!x &&
  typeof (x as any).toString === 'function' &&
  ((x as any)[Symbol.toStringTag] === 'AutomergeText' || (x as any).constructor?.name === 'Text');

const isAMCounter = (x: unknown) =>
  !!x && typeof (x as any).value === 'number' && typeof (x as any).increment === 'function';

/** Fallback: strip AM proxies from any nested subtree deterministically. */
const toPlainDeep = (value: unknown): any => {
  if (value == null) return value;
  if (isAMText(value)) return String(value);
  if (isAMCounter(value)) return (value as any).value;
  if (Array.isArray(value)) return (value as unknown[]).map(toPlainDeep);

  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = toPlainDeep(v);
    }
    return out;
  }
  return value;
};
