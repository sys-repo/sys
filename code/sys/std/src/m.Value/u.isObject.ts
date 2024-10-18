import type { t } from '../common.ts';

/**
 * Determine if the given input is typeof {object} and not Null.
 */
export const isObject: t.ValueLib['isObject'] = (input) => {
  return typeof input === 'object' && input !== null;
};
