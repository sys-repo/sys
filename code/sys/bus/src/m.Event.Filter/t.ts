import type { t } from './common.ts';

/**
 * Common filters for the event-bus.
 */
export type EventFilterLib<E extends t.EventWithKind> = {
  /** e.kind matches any of the given kinds (type guard). */
  isKind: <K extends E['kind']>(...kinds: readonly K[]) => (e: E) => e is Extract<E, { kind: K }>;

  /** e.kind starts with the given prefix (type guard). */
  hasPrefix: <P extends string>(prefix: P) => (e: E) => e is Extract<E, { kind: `${P}${string}` }>;

  /** Rx operator: filter by exact kind(s), preserving narrow type. */
  ofKind: <K extends E['kind']>(
    ...kinds: readonly K[]
  ) => (src: t.Observable<E>) => t.Observable<Extract<E, { kind: K }>>;

  /** Rx operator: filter by prefix, preserving narrow type. */
  ofPrefix: <P extends string>(
    prefix: P,
  ) => (src: t.Observable<E>) => t.Observable<Extract<E, { kind: `${P}${string}` }>>;
};
