import { Pkg, pkg } from '../common.ts';
export * from '../common.ts';
export { FocusStyle } from '../../../m.style/m.FocusStyle/mod.ts';

/**
 * Constants:
 */
const name = 'Button.Switch';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  enabled: true,
} as const;
export const D = DEFAULTS;
