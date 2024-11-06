import { pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Constants
 */
const name = pkg.name;
const displayName = `${name}:Button.Switch`;

export const DEFAULTS = {
  name,
  displayName,
} as const;
