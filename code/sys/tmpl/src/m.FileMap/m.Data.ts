import { encodeBase64, decodeBase64 } from '@std/encoding';
import { type t, Path, DEFAULTS } from './common.ts';
import { Is } from './m.Is.ts';

const contentTypes = DEFAULTS.contentTypes;
type Ext = keyof typeof contentTypes;


export const Data: t.FileMapDataLib = {
  contentType(path) {
    if (!Is.pathSupported(path)) return '';
    const ext = Path.extname(path) as Ext;
    return contentTypes[ext] || '';
  },
  encode(contentType, input) {
    if (input.startsWith('data:')) return input;
    return `data:${contentType};base64,${encodeBase64(input)}`;
  },
  decode(input) {
    if (!Is.dataUri(input)) throw new Error('Input not a "data:" URI');
    if (!input.includes(`;base64,`)) throw new Error('Data URI is not base64 encoded');
    const text = input.split(',')[1];
    const binary = decodeBase64(text);
    return new TextDecoder().decode(binary);
  },
};
