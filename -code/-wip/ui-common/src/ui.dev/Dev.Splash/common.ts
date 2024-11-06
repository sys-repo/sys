import { DEFAULTS as BASE, pkg } from '../common.ts';
export * from '../common.ts';

const name = 'DevSplash';
export const DEFAULTS = {
  displayName: `${pkg.name}:${name}`,
  qs: BASE.qs,
  fill: true,
  center: true,
  keyboard: true,
};
