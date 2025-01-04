import type { t } from './common.ts';
import { sha1, sha256 } from '../m.Hash/u.hash.ts';

/**
 * Helpers
 */
export const Wrangle = {
  hash(value: unknown, algo?: t.HashAlgoInput) {
    if (algo === 'sha1') return sha1(value);
    if (algo === 'sha256') return sha256(value);
    if (typeof algo === 'function') return algo(value);
    return sha256(value);
  },
} as const;
