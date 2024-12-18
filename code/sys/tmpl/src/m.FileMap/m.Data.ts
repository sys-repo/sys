import { encodeBase64, decodeBase64 } from '@std/encoding';
import { type t } from './common.ts';


export const Data: t.FileMapDataLib = {
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
