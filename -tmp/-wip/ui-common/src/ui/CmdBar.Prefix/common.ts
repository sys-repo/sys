import { pkg } from './common.ts';

export * from '../common.ts';
export { Icons } from '../Icons.ts';

/**
 * Constants
 */
const name = 'CmdHost.Prefix';
export const DEFAULTS = {
  name,
  displayName: `${pkg.name}:${name}`,
} as const;
