import { decodeBase64, encodeBase64, Is as IsBase, MediaType, type t } from './common.ts';
import { Is } from './m.Is.ts';

export const Data: t.FileMap.Data.Lib = Object.freeze({
  contentType: Object.freeze<t.FileMap.Data.Lib['contentType']>({
    fromPath: (path) => MediaType.fromPath(path, { profile: 'source' }) ?? MediaType.Fallback.text,
    fromUri: (uri) => IsBase.string(uri) ? MediaType.fromDataUri(uri) ?? '' : '',
  }),

  encode(mime, input) {
    if (!Is.supported.contentType(mime)) {
      throw new Error(`Content-type "${mime}" not supported`);
    }
    if (IsBase.string(input) && input.startsWith('data:')) {
      // Already a data URI - don't double-encode.
      return input;
    }
    const bytes = IsBase.string(input) ? new TextEncoder().encode(input) : input;
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
});
