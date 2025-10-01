import { type t, Rx } from './common.ts';

/**
 * Reusable utility for managing ref-counted singletons in a registry.
 */
export function singleton<K, P extends { dispose(): void }>(
  registry: Map<K, { refCount: number; producer: P }>,
  key: K,
  create: () => P,
  until?: t.UntilInput,
): { producer: P; dispose: () => void } {
  // Acquire or create the producer.
  let entry = registry.get(key);
  if (!entry) {
    entry = { refCount: 0, producer: create() };
    registry.set(key, entry);
  }

  // Each acquire increments the `refCount`.
  entry.refCount += 1;

  // Per-consumer, idempotent release.
  let released = false;
  const releaseOnce = () => {
    if (released) return;
    released = true;

    const curr = registry.get(key);
    if (!curr) return; // Already torn down elsewhere.

    curr.refCount -= 1;
    if (curr.refCount <= 0) {
      registry.delete(key);
      try {
        curr.producer.dispose();
      } catch {
        // NB: swallow error; producer.dispose should be robust.
      }
    }
  };

  // Optional consumer lifecycle binding.
  if (until) {
    const life = Rx.lifecycle(until);
    life.dispose$.pipe(Rx.take(1)).subscribe(releaseOnce);
  }

  /**
   * API:
   */
  return {
    producer: entry.producer,
    dispose: releaseOnce,
  };
}
