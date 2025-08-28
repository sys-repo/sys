import type { FileMapDataLib } from './t.ts';

import { decodeBase64, encodeBase64 } from '@std/encoding';
import { D, Path } from './common.ts';
import { Is } from './m.Is.ts';

/** Cache a plain ext→mime map (avoid pulling the all() function into the type). */
const EXT_TO_MIME: Record<string, string> = D.contentTypes.all();

export const Data: FileMapDataLib = {
  contentType: {
    fromPath(path) {
      const filename = Path.basename(path);
      const ext = Is.dotfile(filename) ? filename : Path.extname(filename);
      const key = (ext ?? '').toLowerCase();
      return EXT_TO_MIME[key] ?? D.contentType;
    },
    fromUri(uri) {
      if (typeof uri !== 'string') return '';
      if (!Is.dataUri(uri)) return '';
      // strip "data:" and take up to the first ";" or ","
      const rest = uri.slice(5);
      const i = rest.indexOf(';');
      const j = rest.indexOf(',');
      const end = i >= 0 ? i : j >= 0 ? j : rest.length;
      const mime = rest.slice(0, end);
      return mime || D.contentType;
    },
  },

  encode(mime, input) {
    if (!Is.supported.contentType(mime)) {
      throw new Error(`Content-type "${mime}" not supported`);
    }
    if (typeof input === 'string' && input.startsWith('data:')) {
      // Already a data URI – don't double-encode.
      return input;
    }
    const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
    return `data:${mime};base64,${encodeBase64(bytes)}`;
  },

  decode(input) {
    if (!Is.dataUri(input)) throw new Error('Input not a "data:" URI');
    if (!input.includes(';base64,')) throw new Error('Data URI is not base64 encoded');

    const comma = input.indexOf(',');
    const b64 = input.slice(comma + 1);
    const binary = decodeBase64(b64);

    const mime = Data.contentType.fromUri(input);
    const isBinary = Is.contentType.binary(mime);

    return isBinary ? binary : new TextDecoder().decode(binary);
  },
};
