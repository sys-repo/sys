import { Pkg, pkg } from '../common.ts';
export { Http } from '@sys/http/client';
export { Hash } from '@sys/crypto/hash';

export * from '../common.ts';
export { A } from '../Anchor/mod.ts';
export { Bullet } from '../Bullet/mod.ts';
export { BulletList } from '../BulletList/mod.ts';
export { KeyValue } from '../KeyValue/mod.ts';
export { Button } from '../Button/mod.ts';
export { ObjectView } from '../ObjectView/mod.ts';
export { BarSpinner } from '../Spinners.Bar/mod.ts';
export { TextEllipsize } from '../Text.Ellipsize/mod.ts';

/**
 * Constants:
 */
const name = 'Http.Origin';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  observationAction: 'observe manifests',
} as const;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
