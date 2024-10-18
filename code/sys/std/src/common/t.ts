import type * as Rambda from 'rambda';
export * from '../types.ts';

type R = typeof Rambda;

/**
 * Subset of common rambda helpers.
 */
export type RLib = {
  readonly clone: R['clone'];
  readonly equals: R['equals'];
  readonly mergeDeepRight: R['mergeDeepRight'];
  readonly prop: R['prop'];
  readonly sortBy: R['sortBy'];
  readonly toString: R['toString'];
  readonly uniq: R['uniq'];
  readonly uniqBy: R['uniqBy'];
};
