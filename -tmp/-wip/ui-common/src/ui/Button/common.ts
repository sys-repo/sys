import { pkg, COLORS, type t } from '../common.ts';
export * from '../common.ts';

/**
 * Constants
 */
const name = 'Button';
const displayName = `${pkg.name}:${name}`;

const spinner: t.ButtonSpinner = {
  width: 30,
  color: { enabled: COLORS.BLUE, disabled: COLORS.DARK },
};

export const DEFAULTS = {
  name,
  displayName,
  enabled: true,
  active: true,
  block: false,
  spinning: false,
  disabledOpacity: 0.3,
  userSelect: false,
  pressedOffset: [0, 1] as [number, number],
  spinner,
  copy: {
    message: 'copied',
    fontSize: 12,
    delay: 1200,
    opacity: 0.6,
  },
} as const;
