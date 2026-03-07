import { type t, Is } from './common.ts';

export const memo: t.LazyLib['memo'] = (compute, optsInput) => {
  const { reset$ } = normalizeOptions(optsInput);
  let cached: unknown;
  let hasValue = false;

  const reset = () => {
    hasValue = false;
    cached = undefined;
  };

  const fn = (() => {
    if (!hasValue) {
      cached = compute();
      hasValue = true;
    }
    return cached;
  }) as t.LazyMemo<unknown>;

  Object.defineProperty(fn, 'value', {
    enumerable: true,
    get: () => fn(),
  });

  fn.reset = reset;
  reset$?.subscribe(() => reset());
  return fn as t.LazyMemo<any>;
};

/**
 * Helpers
 */
const normalizeOptions = (input?: t.LazyMemoOptions | t.Observable<unknown>): t.LazyMemoOptions => {
  if (!input) return {};
  return Is.observable(input) ? { reset$: input } : input;
};
