import { encodeBase64, decodeBase64 } from '@std/encoding';
import { type t, Path, DEFAULTS } from './common.ts';
import { Is } from './m.Is.ts';

const contentTypes = DEFAULTS.contentTypes;
type Ext = keyof typeof contentTypes;


export const Data: t.FileMapDataLib = {
  contentType(path) {
    if (!Is.supported(path)) return '';
    const ext = Path.extname(path) as Ext;
    return contentTypes[ext] || '';
  },
  encode(input) {
    if (input.startsWith('base64-')) return input;
    return `base64-${encodeBase64(input)}`;
  },
  decode(input) {
    if (!input.startsWith('base64-')) {
      throw new Error('Supported encoding format could not be derived');
    }
    const text = input.replace(/^base64-/, '');
    const binary = decodeBase64(text);
    return new TextDecoder().decode(binary);
  },
};
