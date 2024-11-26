import { COLORS, pkg, type t, DEFAULTS as BASE } from '../common.ts';
export * from '../common.ts';

/**
 * Constants
 */
const style: Required<t.DevTodoStyle> = {
  color: COLORS.DARK,
  margin: [6, 0, 6, 0],
};

export const DEFAULTS = {
  displayName: `${pkg.name}:DevTools.Todo`,
  style,
  md: BASE.md,
} as const;
