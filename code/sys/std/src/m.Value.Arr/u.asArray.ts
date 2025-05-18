import type { t } from '../common.ts';

export const asArray: t.ArrayLib['asArray'] = <T>(input: T | T[]): T[] => {
  return Array.isArray(input) ? input : [input];
};
