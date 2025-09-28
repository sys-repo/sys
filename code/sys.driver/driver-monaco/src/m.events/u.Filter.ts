import { type t, Rx } from './common.ts';

/**
 * Filter API:
 */
export const Filter: t.EventBusFilterLib = {
  isKind: _isKind,
  hasPrefix: _hasPrefix,
  ofPrefix(prefix) {
    return (src) => src.pipe(Rx.filter(_hasPrefix(prefix)));
  },
  ofKind(...kinds) {
    return (src) => src.pipe(Rx.filter(_isKind(...kinds)));
  },
};

/**
 * Helpers:
 */
function _isKind<K extends t.EditorEvent['kind']>(...kinds: readonly K[]) {
  type T = Extract<t.EditorEvent, { kind: K }>;
  return (e: t.EditorEvent): e is T => inSet(kinds)(e.kind);
}

function _hasPrefix<P extends string>(prefix: P) {
  type T = Extract<t.EditorEvent, { kind: `${P}${string}` }>;
  return (e: t.EditorEvent): e is T => e.kind.startsWith(prefix);
}

/** Helper: Array.includes for string-literal unions without widening. */
function inSet<S extends string>(set: readonly S[]) {
  return (x: string): x is S => (set as readonly string[]).includes(x);
}
