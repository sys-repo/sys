import { orderByRecency } from './u.orderByRecency.ts';
import { prepare } from './u.prepre.ts';
import { get } from './u.get.ts';

/**
 * Base config file heleprs.
 */
export const Config = {
  get,
  prepare,
  orderByRecency,
} as const;
