import { type t, DEFAULTS as BASE, pkg } from '../common.ts';

export * from '../common.ts';
export * from './common.Calc.ts';

/**
 * Constants
 */
const name = 'ModuleList';
const displayName = `${pkg.name}:${name}`;

export const DEFAULTS: t.ModuleListDefaults = {
  name,
  displayName,
  qs: BASE.qs,
  list: { minWidth: 360 },
  useAnchorLinks: true,
  showParamDev: true,
} as const;
