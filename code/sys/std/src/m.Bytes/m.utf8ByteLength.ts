import type { t } from './common.ts';

/** Return the byte length of a string using canonical UTF-8 encoding semantics. */
export const utf8ByteLength = (input: string): t.NumberBytes => {
  let bytes = 0;

  for (let index = 0; index < input.length; index++) {
    const code = input.charCodeAt(index);

    if (code < 0x80) {
      bytes += 1;
    } else if (code < 0x800) {
      bytes += 2;
    } else if (isHighSurrogate(code)) {
      const next = input.charCodeAt(index + 1);
      if (isLowSurrogate(next)) {
        bytes += 4;
        index++;
      } else {
        bytes += 3;
      }
    } else {
      bytes += 3;
    }
  }

  return bytes;
};

function isHighSurrogate(code: number): boolean {
  return code >= 0xd800 && code <= 0xdbff;
}

function isLowSurrogate(code: number): boolean {
  return code >= 0xdc00 && code <= 0xdfff;
}
