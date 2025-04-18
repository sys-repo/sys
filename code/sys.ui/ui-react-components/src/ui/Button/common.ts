import { pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Constants
 */
const name = 'Button';
const displayName = `${pkg.name}:${name}`;

export const DEFAULTS = {
  name,
  displayName,
  enabled: true,
  active: true,
  block: false,
  disabledOpacity: 0.3,
  userSelect: false,
  pressedOffset: [0, 1] as [number, number],
} as const;
