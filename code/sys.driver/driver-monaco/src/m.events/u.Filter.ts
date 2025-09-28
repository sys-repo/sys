import { type t, Rx } from './common.ts';

/**
 * Filter API:
 */
export const Filter: t.EventBusFilterLib = {
  isKind: _isKind,
  hasPrefix: _hasPrefix,
  ofKind:
    (...kinds) =>
    (src) =>
      src.pipe(Rx.filter(_isKind(...kinds))),
  ofPrefix: (prefix) => (src) => src.pipe(Rx.filter(_hasPrefix(prefix))),
};

/**
 * Helpers:
 */
function _isKind<K extends t.EditorEvent['kind']>(...kinds: readonly K[]) {
  return (e: t.EditorEvent): e is Extract<t.EditorEvent, { kind: K }> => inSet(kinds)(e.kind);
}

function _hasPrefix<P extends string>(prefix: P) {
  return (e: t.EditorEvent): e is Extract<t.EditorEvent, { kind: `${P}${string}` }> =>
    e.kind.startsWith(prefix);
}

/** Helper: Array.includes for string-literal unions without widening. */
const inSet =
  <S extends string>(set: readonly S[]) =>
  (x: string): x is S =>
    (set as readonly string[]).includes(x);
