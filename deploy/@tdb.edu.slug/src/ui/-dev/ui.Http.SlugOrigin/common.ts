import { type t, pkg, Pkg, SlugLoader } from '../common.ts';

export * from '../common.ts';

type P = t.SlugHttpOriginProps;

/**
 * Constants:
 */
const name = 'SlugHttpOrigin';
const domain = 'slc.db.team';
const port = 4040;
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  spec: SlugLoader.Origin.create(port, domain),
  port,
  domain,
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
