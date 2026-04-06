import { type t, pkg, Pkg } from '../common.ts';
import { Routes as HttpOriginRoutes } from '../../ui.HttpOrigin/u.routes.ts';

export * from '../common.ts';

/**
 * Constants:
 */
const name = 'HttpDataCards';
export const D = { name, displayName: Pkg.toString(pkg, name, false) } as const;
export const DEFAULTS = {
  ...D,
  origin: HttpOriginRoutes.origin.production.proxy,
} as const;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
