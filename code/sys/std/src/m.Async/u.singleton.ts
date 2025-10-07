import { type t, Rx } from './common.ts';

/**
 * Create or reuse a singleton producer keyed by `key`, with refcounted teardown.
 *
 * - `create` constructs the producer the first time.
 * - The returned handle's `dispose()` releases *this* acquisition (idempotent).
 * - When the refcount drops to zero, `producer.dispose()` is called exactly once.
 * - If `until$` is provided, the handle auto-releases when it emits/completes.
 */
export function singleton<K, P extends t.DisposableLike>(
  registry: Map<K, { refCount: number; producer: P }>,
  key: K,
  create: () => P,
  until?: t.UntilInput,
): t.SingletonHandle<P> {
  // Acquire or create entry:
  let entry = registry.get(key);
  if (!entry) {
    entry = { refCount: 0, producer: create() };
    registry.set(key, entry);
  }

  // Increment ref-count for this handle:
  entry.refCount += 1;

  // Idempotent per-handle release:
  let released = false;
  const releaseOnce = () => {
    if (released) return;
    released = true;

    const curr = registry.get(key);
    if (!curr) return; // already torn down elsewhere

    curr.refCount -= 1;
    if (curr.refCount <= 0) {
      registry.delete(key);
      try {
        curr.producer.dispose();
      } catch {
        // NB: swallow producer.dispose() errors to protect callers.
      }
    }
  };

  // (Optional) parent lifecycle binding for this handle:
  if (until) Rx.lifecycle(until).dispose$.pipe(Rx.take(1)).subscribe(releaseOnce);

  /**
   * API:
   */
  return {
    producer: entry.producer,
    dispose: releaseOnce,
  };
}
