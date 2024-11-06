import { COLORS, pkg } from '../common.ts';

export { Button } from '../Button/mod.ts';
export * from '../common.ts';

/**
 * Constants
 */
const name = 'PropList.FieldSelector';
export const DEFAULTS = {
  displayName: `${pkg.name}:${name}`,
  indexes: true,
  indent: 0,
  resettable: true,
  switchColor: COLORS.BLUE,
  label: {
    reset: 'reset',
    clear: 'clear',
  },
} as const;
