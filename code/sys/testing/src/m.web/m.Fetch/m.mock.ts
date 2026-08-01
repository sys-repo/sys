import type { t } from './common.ts';

/**
 * Replace `globalThis.fetch` with the supplied function until disposal.
 *
 * Successful disposal is idempotent and restores the exact prior own-property descriptor, or its
 * absence. A failed restoration throws and remains retryable. Dispose nested mocks in LIFO order and
 * do not overlap this process-global fixture across parallel tests. The replacement owns all Fetch
 * behavior, including `AbortSignal` handling.
 */
export function mock(replacement: t.Fetch): t.WebFixtureFetch.Mock {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'fetch');
  let disposed = false;

  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    writable: true,
    value: replacement,
  });

  return {
    dispose() {
      if (disposed) return;

      if (descriptor) {
        Object.defineProperty(globalThis, 'fetch', descriptor);
      } else if (!Reflect.deleteProperty(globalThis, 'fetch')) {
        throw new TypeError('Failed to restore the prior globalThis.fetch state.');
      }

      disposed = true;
    },
  };
}
