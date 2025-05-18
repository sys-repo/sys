import type { t } from './common.ts';
import { digest } from './u.digest.ts';
import { Wrangle } from './u.wrangle.ts';
import { FileHashUri } from './m.Uri.ts';

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

      const hash = Wrangle.hash(value, options.algo);
      const bytes = wrangle.bytes(value);
      parts[key] = FileHashUri.toUri(hash, bytes);

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
    if (Array.isArray(input)) return { initial: input };
    if (typeof input === 'string' || typeof input === 'function') {
      const algo = input as t.CompositeHashBuildOptions['algo'];
      return { algo };
    }
    return input ?? {};
  },

  bytes(value: unknown) {
    if (value instanceof ArrayBuffer) {
      return value.byteLength;
    } else if (ArrayBuffer.isView(value)) {
      // any TypedArray or DataView (e.g. Uint8Array)
      return (value as ArrayBufferView).byteLength;
    } else if (hasBytes(value)) {
      return value.bytes;
    }
    return undefined;
  },
} as const;

type HasBytes = { bytes: number };
function hasBytes(v: unknown): v is HasBytes {
  return Boolean(v && typeof (v as HasBytes).bytes === 'number');
}
