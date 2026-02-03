import { type t, pkg, Pkg } from '../common.ts';

export * from '../common.ts';

type P = t.DevLoaderProps;

/**
 * Constants:
 */

const local = 'http://localhost:4040';
const prod = 'slc.db.team';

const name = 'Dev.SlugLoader';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),

  origin: {
    default: 'localhost' satisfies t.DevLoaderOriginKind,
    local: { app: local, cdn: { default: local, video: local } } satisfies t.SlugLoaderOrigin,
    prod: {
      app: `https://${prod}`,
      cdn: { default: `https://cdn.${prod}`, video: `https://video.cdn.${prod}` },
    } satisfies t.SlugLoaderOrigin,
  },
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
