import { type t, DEFAULTS as BASE, Pkg } from '../common.ts';

export * from '../common.ts';
export * from './common.Calc.ts';

/**
 * Constants
 */
export const DEFAULTS: t.ModuleListDefaults = {
  displayName: `${Pkg.name}:ModuleList`,
  qs: BASE.qs,
  list: { minWidth: 360 },
  useAnchorLinks: true,
  showParamDev: true,
} as const;
