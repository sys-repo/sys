import { pkg } from './common.ts';

export { Keyboard } from '@sys/ui-dom';
export * from '../common.ts';

/**
 * Constants
 */
export const DEFAULTS = {
  displayName: {
    EventProps: `${pkg.name}.EventProps`,
  },
} as const;
