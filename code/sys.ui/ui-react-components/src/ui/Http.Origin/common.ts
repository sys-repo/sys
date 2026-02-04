import { type t, pkg, Pkg } from '../common.ts';

export * from '../common.ts';
export { Bullet } from '../Bullet/mod.ts';
export { KeyValue } from '../KeyValue/mod.ts';
export { Button } from '../Button/mod.ts';
export { ObjectView } from '../ObjectView/mod.ts';

type P = t.HttpOriginProps;

/**
 * Constants:
 */
const local = 'http://localhost:4040';

const name = 'Http.Origin';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),

  kind: {
    default: 'localhost' satisfies t.HttpOriginEnv,
    local: { app: local, cdn: { default: local, video: local } } satisfies t.HttpOriginMap,
    prod: {
    } satisfies t.HttpOriginMap,
  },
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
