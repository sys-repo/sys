import { pkg } from '../common.ts';
export * from '../common.ts';

/**
 * Constants
 */
export const DEFAULTS = {
  displayName: `${pkg.name}:DevTools.Textbox`,
  isEnabled: true,
  placeholder: 'enter text here...',
} as const;
