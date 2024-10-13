import type { t } from './common.ts';

/**
 * Flag evaluators.
 */
export const Is: t.ObjectPathIsLib = {
  path(input: any): input is t.ObjectPath {
    if (!Array.isArray(input)) return false;
    return input.every((item) => typeof item === 'string' || typeof item === 'number');
  },
} as const;
