import { Pkg, pkg } from '../common.ts';
export * from '../common.ts';
export { FocusStyle } from '../../../m.style/m.FocusStyle/mod.ts';

/**
 * Constants:
 */
const name = 'Button';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  enabled: true,
  active: true,
  block: false,
  userSelect: false,
  borderRadius: 1,
  pressedOffset: [0, 1] as [number, number],
  opacity: { enabled: 1, disabled: 0.3 },
} as const;
export const D = DEFAULTS;
