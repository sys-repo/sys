import { type t, Err, R } from './common.ts';
import { Is } from './m.Is.ts';
import { sha1, sha256 } from './u.hash.ts';

type BuildOptionsInput = t.CompositeHashBuildOptions | t.CompositeHashBuildOptions['hash'];
type VerifyOptionsInput = t.CompositeHashVerifyOptions | t.HashVerifyLoader;

export const CompositeHash: t.CompositeHashLib = {
  toComposite(input) {
    if (!input) return { digest: '', parts: {} };
    return Is.compositeBuilder(input) ? input.toObject() : input;
  },

  builder(input = {}) {
    const options = wrangle.builderOptions(input);
    const parts: { [key: string]: string } = {};
    let _digest: string | undefined;
    const reset = () => (_digest = undefined);

    const api: t.CompositeHashBuilder = {
      get length() {
        return Object.keys(parts).length;
      },

      get digest() {
        if (api.length === 0) return '';
        return _digest ?? (_digest = CompositeHash.digest(parts, options));
      },
      get parts() {
        return { ...parts };
      },

      add(key, value) {
        reset();
        parts[key] = wrangle.hash(value, options.hash);
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

  digest(parts: t.CompositeHash['parts'], options: t.CompositeHashBuildOptions = {}) {
    const hashes: string[] = [];
    Object.keys(parts)
      .sort()
      .forEach((key) => hashes.push(parts[key]));
    return wrangle.hash(hashes.join('\n'), options.hash);
  },

  async verify(hash, args) {
    const { loader } = wrangle.verifyArgs(args);
    const errors = Err.errors();
    const current = CompositeHash.builder();

    const res: t.HashVerifyResponse = {
      is: { valid: undefined },
      hash: {
        a: CompositeHash.toComposite(hash),
        b: CompositeHash.toComposite(), // NB: empty.
      },
    };

    /**
     * Build up the composite hash of the current state
     */
    for (const part of Object.keys(hash.parts)) {
      const data = await loader({ part });
      if (data === undefined) {
        res.is.valid = false;
        errors.push(`The loader did not return content for part: ${part}`);
      } else {
        current.add(part, data);
      }
    }
    res.hash.b = current.toObject();
    res.error = errors.toError();
    res.is.valid = res.error ? false : R.equals(res.hash.a, res.hash.b);
    return res;
  },
};

/**
 * Helpers
 */
const wrangle = {
  builderOptions(input?: BuildOptionsInput): t.CompositeHashBuildOptions {
    if (!input) return {};
    if (typeof input === 'string' || typeof input === 'function') {
      const hash = input as t.CompositeHashBuildOptions['hash'];
      return { hash };
    }
    return input ?? {};
  },

  verifyArgs(input: VerifyOptionsInput): t.CompositeHashVerifyOptions {
    if (typeof input === 'function') return { loader: input };
    return input;
  },

  hash(value: unknown, hash?: t.CompositeHashAlgoInput) {
    if (hash === 'sha1') return sha1(value);
    if (hash === 'sha256') return sha256(value);
    if (typeof hash === 'function') return hash(value);
    return sha256(value);
  },
} as const;
