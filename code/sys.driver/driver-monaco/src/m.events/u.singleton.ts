import { type t, Rx } from './common.ts';

/**
 * Reusable utility for managing ref-counted singletons in a registry.
 */
export function singleton<K, P extends { dispose(): void }>(
  registry: Map<K, { refCount: number; producer: P }>,
  key: K,
  create: (e: { life: t.Lifecycle }) => P,
  until?: t.UntilInput,
): { producer: P; dispose: () => void } {
  // Reuse existing
  const existing = registry.get(key);
  if (existing) {
    existing.refCount++;
    return {
      producer: existing.producer,
      dispose: () => release(registry, key),
    };
  }

  // Create new:
  const life = Rx.lifecycle(until);
  const producer = create({ life });
  registry.set(key, { refCount: 1, producer });

  // Consumer lifecycle:
  life.dispose$.pipe(Rx.take(1)).subscribe(() => release(registry, key));

  return {
    producer,
    dispose: life.dispose,
  } as const;
}

/**
 * Decrements refCount and disposes/removes producer if no consumers remain.
 */
function release<K, P extends { dispose(): void }>(
  registry: Map<K, { refCount: number; producer: P }>,
  key: K,
) {
  const entry = registry.get(key);
  if (!entry) return;
  entry.refCount--;
  if (entry.refCount <= 0) {
    entry.producer.dispose();
    registry.delete(key);
  }
}
