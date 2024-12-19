import { type t, DEFAULTS, Path } from './common.ts';

export const Is: t.FileMapIsLib = {
  pathSupported(path) {
    if (typeof path !== 'string') return false;
    const ext = wrangle.ext(path);
    const exts = Object.keys(DEFAULTS.contentTypes);
    return ext ? exts.some((m) => m == ext) : false;
  },

  mimeSupported(contentType) {
    if (typeof contentType !== 'string') return false;
    return Object.values(DEFAULTS.contentTypes).some((v: string) => v === contentType);
  },

  dataUri(input) {
    if (typeof input !== 'string') return false;
    if (!input.startsWith('data:')) return false;
    return input.includes(',') && input.includes('/');
  },
};

/**
 * Helpers
 */
const wrangle = {
  ext(input: string): string {
    if (input.startsWith('.') && wrangle.totalPeriods(input) === 1) return input;
    return Path.extname(input);
  },
  totalPeriods(input: string): number {
    return (input.match(/\./g) || []).length;
  },
} as const;
