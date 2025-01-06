import { type t, Err, R } from './common.ts';
import { builder } from './u.builder.ts';
import { toComposite } from './u.toComposite.ts';

export const verify: t.CompositeHashLib['verify'] = async (hash, argsInput) => {
  const args = wrangle.verifyArgs(argsInput);
  const { loader, algo } = args;
  const errors = Err.errors();
  const current = builder({ algo });

  const res: t.HashVerifyResponse = {
    is: { valid: undefined },
    hash: {
      a: toComposite(hash),
      b: toComposite(), // NB: empty.
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
};

/**
 * Helpers
 */
const wrangle = {
  verifyArgs(input: t.CompositeHashVerifyArgsInput): t.CompositeHashVerifyOptions {
    if (typeof input === 'function') return { loader: input };
    return input;
  },
} as const;
