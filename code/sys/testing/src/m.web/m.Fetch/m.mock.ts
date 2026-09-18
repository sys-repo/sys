import type { t } from './common.ts';
import { Property } from '../m.Property/mod.ts';

/**
 * Replace `globalThis.fetch` with the supplied function until disposal.
 *
 * Successful disposal is idempotent and restores the exact prior own-property descriptor, or its
 * absence. A failed restoration throws and remains retryable. Dispose nested mocks in LIFO order and
 * do not overlap this process-global fixture across parallel tests. The replacement owns all Fetch
 * behavior, including `AbortSignal` handling.
 */
export function mock(replacement: t.Fetch): t.WebFixture.Fetch.Mock {
  return Property.mock([
    {
      target: globalThis,
      key: 'fetch',
      descriptor: {
        configurable: true,
        writable: true,
        value: replacement,
      },
    },
  ]);
}
