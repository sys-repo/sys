export * from '../common.ts';
export { Delete } from '../m.Delete/mod.ts';

type O = Record<string, unknown>;

export function isObject(input: unknown): input is O {
  return input !== null && typeof input === 'object';
}

/**
 * Default values for Errors.
 */
export const DEFAULTS = {
  name: {
    error: 'Error',
    aggregate: 'AggregateError',
  },
} as const;
