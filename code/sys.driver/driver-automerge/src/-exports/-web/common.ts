export * from '../common.ts';

/**
 * Constants
 */
export const DEFAULTS = {
  database: 'crdt',
  store: 'documents',
} as const;
export const D = DEFAULTS;
