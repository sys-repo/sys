import { pkg } from './common.ts';
export * from '../common.ts';

/**
 * Constants
 */
export const DEFAULTS = {
  displayName: `${pkg.name}:Flip`,
  speed: 300,
} as const;
