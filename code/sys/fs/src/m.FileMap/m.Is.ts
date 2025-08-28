// m.Is.ts
import { D, Path } from './common.ts';
import type { FileMapIsLib } from './t.ts';

/** Build canonical supported set once (lowercased). */
const EXT_TO_MIME_ALL = D.contentTypes.all() as Record<string, string>;
const SUPPORTED_MIME_SET = new Set<string>([
  D.contentType.toLowerCase(),
  ...Object.values(EXT_TO_MIME_ALL).map((m) => m.toLowerCase()),
  ...Object.keys(D.contentTypes.structuredText as Record<string, true>).map((m) => m.toLowerCase()),
]);

/** For text/binary classification we still need “text-like” rules. */
const TEXT_MIME_SET = new Set<string>(
  Object.values(D.contentTypes.text as Record<string, string>).map((m) => m.toLowerCase()),
);
const STRUCTURED_TEXT_SET = new Set<string>(
  Object.keys(D.contentTypes.structuredText as Record<string, true>).map((m) => m.toLowerCase()),
);

export const Is: FileMapIsLib = {
  dataUri(input) {
    if (typeof input !== 'string') return false;
    if (!input.startsWith('data:')) return false;
    return input.includes('/') && input.includes(',');
  },

  dotfile(input) {
    const filename = Path.basename(input);
    return filename.startsWith('.') && wrangle.totalPeriods(filename) === 1;
  },

  supported: {
    contentType(mime) {
      if (typeof mime !== 'string') return false;
      return SUPPORTED_MIME_SET.has(mime.toLowerCase());
    },
  },

  contentType: {
    string(mime) {
      if (typeof mime !== 'string') return false;
      const m = mime.toLowerCase();
      if (!Is.supported.contentType(m)) return false; // only classify known types
      if (m.startsWith('text/')) return true;
      if (m.endsWith('/xml') || m.endsWith('+xml')) return true;
      if (TEXT_MIME_SET.has(m)) return true;
      if (STRUCTURED_TEXT_SET.has(m)) return true;
      return false;
    },
    binary(mime) {
      if (typeof mime !== 'string') return false;
      const m = mime.toLowerCase();
      if (!Is.supported.contentType(m)) return false;
      return !Is.contentType.string(m);
    },
  },
};

/** Helpers */
const wrangle = {
  ext(input: string): string {
    if (Is.dotfile(input)) return input;
    return Path.extname(input);
  },
  totalPeriods(input: string): number {
    return (input.match(/\./g) || []).length;
  },
} as const;

// import { D, Path } from './common.ts';
// import type { FileMapIsLib } from './t.ts';
//
// // Plain records + widened sets (all lower-cased for robust compare):
// const types = D.contentTypes;
// const EXT_TO_MIME_ALL = types.all();
// const EXT_TO_MIME_TEXT = types.text;
// // Keep for future use; silence "unused":
// const EXT_TO_MIME_BIN = types.binary;
// void EXT_TO_MIME_BIN;
//
// const ALL_MIME = new Set<string>(Object.values(EXT_TO_MIME_ALL).map((m) => m.toLowerCase()));
// const TEXT_MIME = new Set<string>(Object.values(EXT_TO_MIME_TEXT).map((m) => m.toLowerCase()));
// const STRUCTURED_TEXT = new Set<string>(
//   Object.keys(types.structuredText).map((m) => m.toLowerCase()),
// );
//
// export const Is: FileMapIsLib = {
//   /** Lightweight RFC2397-ish check for our needs. */
//   dataUri(input) {
//     if (typeof input !== 'string') return false;
//     if (!input.startsWith('data:')) return false;
//     return input.includes('/') && input.includes(',');
//   },
//
//   /** True for ".gitignore" style (single leading dot, no other dots). */
//   dotfile(input) {
//     const filename = Path.basename(input);
//     return filename.startsWith('.') && wrangle.totalPeriods(filename) === 1;
//   },
//
//   supported: {
//     /** MIME is either the default or present in our ext→mime registry. */
//     contentType(mime) {
//       if (typeof mime !== 'string') return false;
//       if (mime === D.contentType) return true;
//       const m = mime.toLowerCase();
//       return ALL_MIME.has(m);
//     },
//   },
//
//   contentType: {
//     /**
//      * Treat as text if:
//      * - listed in `contentTypes.text`
//      * - startsWith('text/')
//      * - endsWith('/xml') or '+xml' (e.g. image/svg+xml)
//      * - explicitly whitelisted in `structuredText`
//      */
//     string(mime) {
//       if (typeof mime !== 'string') return false;
//       const m = mime.toLowerCase();
//
//       if (TEXT_MIME.has(m)) return true;
//       if (m.startsWith('text/')) return true;
//       if (m.endsWith('/xml') || m.endsWith('+xml')) return true;
//       if (STRUCTURED_TEXT.has(m)) return true;
//
//       return false;
//     },
//
//     /**
//      * Binary iff we recognize the MIME and it's not text.
//      * (Conservative: unknown MIME returns false.)
//      */
//     binary(mime) {
//       if (typeof mime !== 'string') return false;
//       const m = mime.toLowerCase();
//       if (!Is.supported.contentType(m)) return false;
//       return !Is.contentType.string(m);
//     },
//   },
// };
//
// /**
//  * Helpers:
//  */
// const wrangle = {
//   ext(input: string): string {
//     if (Is.dotfile(input)) return input;
//     return Path.extname(input);
//   },
//   totalPeriods(input: string): number {
//     return (input.match(/\./g) || []).length;
//   },
// } as const;
