import { decodeBase64, encodeBase64 } from '@std/encoding';
import { type t, DEFAULTS, Path } from './common.ts';
import { Is } from './m.Is.ts';

const contentTypes = DEFAULTS.contentTypes;
type Ext = keyof typeof contentTypes;

export const Data: t.FileMapDataLib = {
  contentType: {
    fromPath(path) {
      if (!Is.supported.path(path)) return '';
      const filename = Path.basename(path);
      const key = (Is.dotfile(filename) ? filename : Path.extname(filename)) as Ext;
      return contentTypes[key] || '';
    },
    fromUri(uri) {
      if (typeof uri !== 'string') return '';
      if (!Is.dataUri(uri)) return '';
      uri = uri.replace(/^data\:/, '');
      return uri.split(';')[0];
    },
  },

  encode(mime, input) {
    if (!Is.supported.contentType(mime)) throw new Error(`Content-type "${mime}" not supported`);
    if (typeof input === 'string' && input.startsWith('data:')) return input; // NB: don't double-encode.
    return `data:${mime};base64,${encodeBase64(input)}`;
  },

  decode(input) {
    if (!Is.dataUri(input)) throw new Error('Input not a "data:" URI');
    if (!input.includes(`;base64,`)) throw new Error('Data URI is not base64 encoded');
    const text = input.split(',')[1];
    const binary = decodeBase64(text);
    const uri = Data.contentType.fromUri(input);
    const isBinary = Is.contentType.binary(uri);
    return isBinary ? binary : new TextDecoder().decode(binary);
  },
};
