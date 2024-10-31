import type { t } from './common.ts';
import { sha1, sha256 } from './u.hash.ts';

/**
 * Helpers
 */
export const Wrangle = {
  hash(value: unknown, hash?: t.HashAlgoInput) {
    if (hash === 'sha1') return sha1(value);
    if (hash === 'sha256') return sha256(value);
    if (typeof hash === 'function') return hash(value);
    return sha256(value);
  },
} as const;
