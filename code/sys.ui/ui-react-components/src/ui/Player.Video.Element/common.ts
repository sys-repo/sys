import { pkg, Pkg } from '../common.ts';
export * from '../common.ts';

export { Button } from '../Button/mod.ts';
export { BarSpinner } from '../Spinners.Bar/mod.ts';
export { Icons } from '../ui.Icons.ts';
export * from './const.READY_STATE.ts';

/**
 * Constants:
 */
const name = 'VideoElement';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  scale: 1,
  loop: false,
  aspectRatio: '16/9',
  cornerRadius: 0,
} as const;
export const D = DEFAULTS;
