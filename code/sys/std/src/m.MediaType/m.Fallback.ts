import { FALLBACK_BINARY, FALLBACK_TEXT, type t } from './common.ts';

/** Explicit caller-selected fallback values. */
export const Fallback: t.MediaType.Fallback.Lib = Object.freeze({
  binary: FALLBACK_BINARY,
  text: FALLBACK_TEXT,
});
