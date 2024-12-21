import { type t, DEFAULTS, Path } from './common.ts';

const contentTypes = DEFAULTS.contentTypes;
type Ext = keyof typeof contentTypes;

export const Is: t.FileMapIsLib = {
  dataUri(input) {
    if (typeof input !== 'string') return false;
    if (!input.startsWith('data:')) return false;
    return input.includes(',') && input.includes('/');
  },

  dotfile(input) {
    const filename = Path.basename(input);
    return filename.startsWith('.') && wrangle.totalPeriods(filename) === 1;
  },

  supported: {
    path(path) {
      if (typeof path !== 'string') return false;
      const filename = Path.basename(path);
      const ext = wrangle.ext(filename) as Ext;
      const exts = Object.keys(DEFAULTS.contentTypes);
      return ext ? exts.some((m) => m === ext) : false;
    },
    contentType(mime) {
      if (typeof mime !== 'string') return false;
      return Object.values(DEFAULTS.contentTypes).some((v: string) => v === mime);
    },
  },

  contentType: {
    string(mime) {
      if (!Is.supported.contentType(mime)) return false;
      if (mime.startsWith('text/')) return true;
      return ['application/json', 'image/svg+xml'].includes(mime);
    },
    binary(mime) {
      if (!Is.supported.contentType(mime)) return false;
      if (Is.contentType.string(mime)) return false;
      if (mime.startsWith('image/')) return true;
      return false;
    },
  },
};

/**
 * Helpers
 */
const wrangle = {
  ext(input: string): string {
    if (Is.dotfile(input)) return input;
    return Path.extname(input);
  },
  totalPeriods(input: string): number {
    return (input.match(/\./g) || []).length;
  },
} as const;
