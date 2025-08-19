import { type t, pkg, Pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Constants:
 */
const name = 'SplitPane';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name, false),
  enabled: true,
  orientation: 'horizontal' satisfies t.Orientation,
  defaultValue: 0.5,
  min: 0.1,
  max: 0.9,
  gutter: 6,
} as const;
export const D = DEFAULTS;
