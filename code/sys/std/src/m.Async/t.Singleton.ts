import type { t } from './common.ts';

/**
 * Ref-counted registry entry for a singleton producer.
 */
export type SingletonEntry<P extends t.DisposableLike> = {
  readonly refCount: number;
  readonly producer: P;
};

/**
 * Per-acquire handle to a singleton producer.
 * Disposing releases this acquisition; the final release disposes the producer.
 */
export type SingletonHandle<P extends t.DisposableLike> = {
  readonly producer: P;
  dispose: () => void; // idempotent per-consumer release
};
