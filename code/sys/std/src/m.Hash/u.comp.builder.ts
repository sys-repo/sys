import type { t } from './common.ts';
import { digest } from './u.comp.digest.ts';
import { Wrangle } from './u.wrangle.ts';

type Input = t.CompositeHashBuilderOptionsInput;
type Parts = t.DeepMutable<t.CompositeHashParts>;

export const builder: t.CompositeHashLib['builder'] = (input = {}) => {
  const options = wrangle.options(input);
  const parts: Parts = {};
  let _digest: string | undefined;
  const reset = () => (_digest = undefined);

  const api: t.CompositeHashBuilder = {
    algo: options.algo ?? 'sha256',

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
      parts[key] = Wrangle.hash(value, options.algo);
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

  // Initialize.
  options.initial?.forEach(({ key, value }) => api.add(key, value));
  return api;
};

/**
 * Helpers
 */
const wrangle = {
  options(input?: t.CompositeHashBuilderOptionsInput): t.CompositeHashBuildOptions {
    if (!input) return {};
    if (typeof input === 'string' || typeof input === 'function') {
      const algo = input as t.CompositeHashBuildOptions['algo'];
      return { algo };
    }
    return input ?? {};
  },
} as const;
