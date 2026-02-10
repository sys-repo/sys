import { type t } from './common.ts';

/**
 * Create a one-shot token for mirrored values in bidirectional sync adapters.
 */
export const mirrorToken: t.EffectCausalLib['mirrorToken'] = <T>() => {
  let hasToken = false;
  let token = undefined as unknown as T;
  const api: t.EffectMirrorToken<T> = {
    mark(value: T) {
      hasToken = true;
      token = value;
    },
    consume(value: T) {
      if (!hasToken) return false;
      if (!Object.is(token, value)) return false;
      hasToken = false;
      return true;
    },
  };
  return api;
};
