import { pkg } from './common.ts';
export * from '../common.ts';

/**
 * Constants
 */
export const DEFAULTS = {
  displayName: `${pkg.name}:DevTools.Button`,
  enabled: true,
  label: 'Unnamed',
} as const;
