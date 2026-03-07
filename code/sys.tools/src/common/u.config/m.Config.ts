import { ensureFile } from './u.ensureFile.ts';
import { get } from './u.get.ts';
import { orderByRecency } from './u.orderByRecency.ts';
import { getPath as path } from './u.path.ts';
import { prepare } from './u.prepare.ts';

/**
 * Base config file heleprs.
 */
export const Config = {
  get,
  path,
  prepare,
  orderByRecency,
  ensureFile,
} as const;
