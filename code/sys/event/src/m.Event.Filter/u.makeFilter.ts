import { type t, Rx } from './common.ts';

type EBase = t.EventWithKind;

/**
 * Factory: build a filter lib specialized to a concrete event union `E`.
 */
export function makeFilter<E extends EBase>(): t.EventFilterLib<E> {
  const isKind = <K extends E['kind']>(...kinds: readonly K[]) => {
    type T = Extract<E, { kind: K }>;
    return (e: E): e is T => inSet(kinds)(e.kind as string);
  };

  const hasPrefix = <P extends string>(prefix: P) => {
    type T = Extract<E, { kind: `${P}${string}` }>;
    return (e: E): e is T => (e.kind as string).startsWith(prefix);
  };

  function ofKind<K extends E['kind']>(...kinds: readonly K[]) {
    return (src: t.Observable<E>) => src.pipe(Rx.filter(isKind(...kinds)));
  }

  function ofPrefix<P extends string>(prefix: P) {
    return (src: t.Observable<E>) => src.pipe(Rx.filter(hasPrefix(prefix)));
  }

  return { isKind, hasPrefix, ofKind, ofPrefix };
}

/**
 * Helpers:
 */
function inSet<S extends string>(set: readonly S[]) {
  /** Array.includes for string-literal unions without widening. */
  return (x: string): x is S => (set as readonly string[]).includes(x);
}
