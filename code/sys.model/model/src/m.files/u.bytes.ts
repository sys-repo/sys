import type { t } from './common.ts';

/** Byte length for Files' canonical UTF-8 inline text encoding. */
export const utf8ByteLength = (input: string): t.NumberBytes => {
  return new TextEncoder().encode(input).byteLength;
};
