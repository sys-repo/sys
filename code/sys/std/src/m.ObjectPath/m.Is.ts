import type { t } from './common.ts';
import type { ObjectPathIsLib } from './t.ts';

/**
 * Flag evaluators.
 */
export const Is: ObjectPathIsLib = {
  path(input: any): input is t.ObjectPath {
    if (!Array.isArray(input)) return false;
    return input.every((item) => typeof item === 'string' || typeof item === 'number');
  },
} as const;
