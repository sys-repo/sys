import type * as Rambda from 'rambda';
export * from '../types.ts';

type R = typeof Rambda;

/**
 * Subset of common rambda helpers.
 */
export type RLib = {
  readonly clone: R['clone'];
  readonly clamp: R['clamp'];
  readonly equals: R['equals'];
  readonly mergeDeepRight: R['mergeDeepRight'];
  readonly flatten: R['flatten'];
  readonly is: R['is'];
  readonly prop: R['prop'];
  readonly sortBy: R['sortBy'];
  readonly toString: R['toString'];
  readonly uniq: R['uniq'];
  readonly uniqBy: R['uniqBy'];
};
