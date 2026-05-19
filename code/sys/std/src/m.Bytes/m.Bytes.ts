import type { t } from './common.ts';
import { utf8ByteLength } from './m.utf8ByteLength.ts';

export { utf8ByteLength };

/**
 * Tools for byte-oriented measurements.
 */
export const Bytes: t.Bytes.Lib = Object.freeze({
  utf8ByteLength,
});
