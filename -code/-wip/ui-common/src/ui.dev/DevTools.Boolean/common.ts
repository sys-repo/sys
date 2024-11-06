import { Button } from '../DevTools.Button/mod.ts';
import { pkg } from './common.ts';

export * from '../common.ts';

/**
 * Constants
 */
export const DEFAULTS = {
  ...Button.DEFAULT,
  displayName: `${pkg.name}:DevTools.Button.Boolean`,
  value: false,
} as const;
