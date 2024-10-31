import type { t } from './common.ts';
import { sha1, sha256 } from './u.hash.ts';

export const CompositeHash: t.CompositeHashLib = {
  create(options = {}) {
    const parts: { [key: string]: string } = {};
    let _digest: string | undefined;
    const reset = () => (_digest = undefined);

    const api: t.CompositeHashBuilder = {
      get length() {
        return Object.keys(parts).length;
      },

      get digest() {
        if (api.length === 0) return '';
        // return _digest ?? '';
        return _digest ?? (_digest = CompositeHash.digest(parts, options));
      },
      get parts() {
        return { ...parts };
      },

      add(key, value) {
        reset();
        parts[key] = wrangle.hash(value, options);
        return api;
      },

      remove(key) {
        reset();
        delete parts[key];
        return api;
      },

      toObject() {
        return {
          digest: api.digest,
          parts: api.parts,
        };
      },

      toString: () => api.digest,
    };

    return api;
  },

  digest(parts: t.CompositeHash['parts'], options: t.CompositeHashOptions = {}) {
    const hashes: string[] = [];
    Object.keys(parts)
      .sort()
      .forEach((key) => hashes.push(parts[key]));

    return wrangle.hash(hashes.join('\n'), options);
  },
};

/**
 * Helpers
 */
const wrangle = {
  hash(value: unknown, options: t.CompositeHashOptions = {}) {
    const { hash } = options;
    if (hash === 'sha1') return sha1(value);
    if (hash === 'sha256') return sha256(value);
    if (typeof hash === 'function') return hash(value);
    return sha256(value);
  },
} as const;
