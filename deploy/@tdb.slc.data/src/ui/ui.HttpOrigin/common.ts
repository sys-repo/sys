import { type t } from '../common.ts';
import { Routes } from './u.routes.ts';

export * from '../common.ts';

/**
 * Constants:
 */
const name = 'HttpOrigin';
const spec: t.HttpOrigin.SpecMap = Routes.origin;

export const D = {
  name,
  displayName: `@tdb/slc-data:${name}`,
  domain: Routes.domain,
  spec,
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
