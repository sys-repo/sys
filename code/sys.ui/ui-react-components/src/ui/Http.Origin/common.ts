import { type t, pkg, Pkg } from '../common.ts';

export * from '../common.ts';
export { Bullet } from '../Bullet/mod.ts';
export { BulletList } from '../BulletList/mod.ts';
export { KeyValue } from '../KeyValue/mod.ts';
export { Button } from '../Button/mod.ts';
export { ObjectView } from '../ObjectView/mod.ts';

type P = t.HttpOriginProps;

/**
 * Constants:
 */
const name = 'Http.Origin';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
} as const;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
