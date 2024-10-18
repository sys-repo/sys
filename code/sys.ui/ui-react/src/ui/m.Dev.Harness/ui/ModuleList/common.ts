import { Pkg, DEFAULTS as BASE } from '../common.ts';

export * from '../common.ts';
export * from './common.Calc.ts';

/**
 * Constants
 */
export const DEFAULTS = {
  displayName: `${Pkg.name}:ModuleList`,
  qs: BASE.qs,
  list: { minWidth: 360 },
  useAnchorLinks: true,
  showParamDev: true,
} as const;
