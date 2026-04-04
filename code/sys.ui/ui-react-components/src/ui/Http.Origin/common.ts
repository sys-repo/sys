import { type t, pkg, Pkg } from '../common.ts';

export * from '../common.ts';
export { A } from '../Anchor/mod.ts';
export { Bullet } from '../Bullet/mod.ts';
export { BulletList } from '../BulletList/mod.ts';
export { Icons } from '../common/u.icons.ts';
export { KeyValue } from '../KeyValue/mod.ts';
export { Button } from '../Button/mod.ts';
export { ObjectView } from '../ObjectView/mod.ts';

/**
 * Constants:
 */
const name = 'Http.Origin';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
} as const;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
