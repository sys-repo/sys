import { COLORS, pkg, type t } from '../common.ts';
export * from '../common.ts';

/**
 * Constants
 */
const style: Required<t.DevTitleStyle> = {
  color: COLORS.DARK,
  margin: [0, 0, 6, 0],
  size: 14,
  bold: true,
  italic: false,
  ellipsis: true,
  opacity: 1,
};

export const DEFAULTS = {
  displayName: `${pkg.name}:DevTools.Title`,
  title: 'Untitled',
  style,
} as const;
