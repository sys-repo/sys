import type { t } from './common.ts';
import { digest } from './u.comp.digest.ts';
import { Wrangle } from './u.wrangle.ts';

export const builder: t.CompositeHashLib['builder'] = (input = {}) => {
  const options = wrangle.options(input);
  const parts: { [key: string]: string } = {};
  let _digest: string | undefined;
  const reset = () => (_digest = undefined);

  const api: t.CompositeHashBuilder = {
    get length() {
      return Object.keys(parts).length;
    },

    get digest() {
      if (api.length === 0) return '';
      return _digest ?? (_digest = digest(parts, options));
    },
    get parts() {
      return { ...parts };
    },

    add(key, value) {
      reset();
      parts[key] = Wrangle.hash(value, options.hash);
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
};

/**
 * Helpers
 */
const wrangle = {
  options(input?: t.CompositeHashBuilderOptionsInput): t.CompositeHashBuildOptions {
    if (!input) return {};
    if (typeof input === 'string' || typeof input === 'function') {
      const hash = input as t.CompositeHashBuildOptions['hash'];
      return { hash };
    }
    return input ?? {};
  },
} as const;
