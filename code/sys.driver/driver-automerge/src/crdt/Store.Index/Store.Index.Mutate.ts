import type { t } from './common.ts';
import { Wrangle } from './u.Wrangle.ts';

/**
 * Manages an index of documents within a repository.
 */
export const Mutate = {
  toggleShared(doc: t.StoreIndexItem, options: { shared?: boolean; version?: number } = {}) {
    const shared = Wrangle.shared(doc);

    if (typeof options.version === 'number') {
      if (options.version < (shared.version?.value ?? -1)) return shared;
    }

    const next = typeof options.shared === 'boolean' ? options.shared : !shared.current;
    if (next !== shared.current) {
      shared.current = next;
      shared.version.increment(wrangle.incrementBy(shared, options));
    }

    return shared;
  },
} as const;

/**
 * Helpers
 */
const wrangle = {
  incrementBy(shared: t.StoreIndexItemShared, options: { version?: number }) {
    if (typeof options.version !== 'number') return 1;
    const current = shared.version?.value ?? 0;
    const next = options.version - current;
    return next <= 0 ? 1 : next;
  },
} as const;
