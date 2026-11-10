import { Pkg, pkg, type t } from '../common.ts';

export { Bullet } from '../Bullet/mod.ts';
export { Button } from '../Button/mod.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'BulletList';
export const D = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  size: 'md' satisfies t.BulletList.Size,
  columns: 1,
  fontSize: { xs: '0.78em', sm: '0.875em', md: '1em' } satisfies Record<t.BulletList.Size, string>,
  lineHeight: 1.25,
  // Separate items while clearing Button's default 2px outline + 2px offset at dense sizes.
  rowGap: 'max(0.375em, 6px)',
  markerSize: '0.5em',
  markerGap: '0.5em',
  columnGap: '1em',
} as const;
export const DEFAULTS = D;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
