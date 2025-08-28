import { D, Path } from './common.ts';
import type { FileMapIsLib } from './t.ts';

/** Build sets from MIME VALUES (and keys for structuredText) */
const EXT_TO_MIME_ALL = D.contentTypes.all();
const EXT_MIME_VALUES = Object.values(EXT_TO_MIME_ALL) as string[];

// structuredText is Record<mime, true>
const STRUCTURED_TEXT_MIME_VALUES = Object.keys(D.contentTypes.structuredText) as string[];

// text bucket from explicit text map (values)
const TEXT_MIME_VALUES = Object.values(D.contentTypes.text) as string[];

/** Sets */
const ALL_MIME = new Set<string>([
  ...EXT_MIME_VALUES,
  ...STRUCTURED_TEXT_MIME_VALUES,
  D.contentType, // default fallback: 'text/plain'
]);

const TEXT_MIME = new Set<string>(TEXT_MIME_VALUES);
const STRUCTURED_TEXT_MIME = new Set<string>(STRUCTURED_TEXT_MIME_VALUES);

export const Is: FileMapIsLib = {
  dataUri(input) {
    if (typeof input !== 'string') return false;
    if (!input.startsWith('data:')) return false;
    return input.includes('/') && input.includes(',');
  },

  dotfile(input) {
    const filename = Path.basename(input);
    return filename.startsWith('.') && (filename.match(/\./g) || []).length === 1;
  },

  supported: {
    contentType(mime) {
      if (typeof mime !== 'string') return false;
      return ALL_MIME.has(mime);
    },
  },

  contentType: {
    string(mime) {
      if (typeof mime !== 'string') return false;
      const m = mime.toLowerCase();

      // images are binary except svg (structured text)
      if (m.startsWith('image/')) return m === 'image/svg+xml';

      if (TEXT_MIME.has(m)) return true;
      if (STRUCTURED_TEXT_MIME.has(m)) return true;
      if (m.startsWith('text/')) return true;
      if (m.endsWith('/xml') || m.endsWith('+xml')) return true;

      return false;
    },

    binary(mime) {
      if (typeof mime !== 'string') return false;
      if (!Is.supported.contentType(mime)) return false;
      return !Is.contentType.string(mime);
    },
  },
};
