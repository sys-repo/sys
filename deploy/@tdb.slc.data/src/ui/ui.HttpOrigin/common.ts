import { type t } from '../common.ts';

export * from '../common.ts';

/**
 * Constants:
 */
const name = 'HttpOrigin';
const domain = 'socialleancanvas.com';
const port = { app: 8080, cdn: 4040 } as const;
const spec: t.HttpOrigin.SpecMap = {
  localhost: {
    app: `http://localhost:${port.app}/data/`,
    cdn: `http://localhost:${port.cdn}/slc-data/`,
  },
  production: {
    proxy: `https://${domain}/data/`,
    cdn: `https://cdn.${domain}/slc-data/`,
  },
};

export const D = {
  name,
  displayName: `@tdb/slc-data:${name}`,
  domain,
  port,
  spec,
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
