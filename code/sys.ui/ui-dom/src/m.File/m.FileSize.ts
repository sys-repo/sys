import { type t, Str } from './common.ts';

/** File-size formatting helpers. */
export const FileSize: t.File.Size.Lib = {
  toString: Str.bytes,
};
