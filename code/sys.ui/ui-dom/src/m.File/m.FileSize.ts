import { type t, Str } from './common.ts';

export const FileSize: t.File.Size.Lib = {
  toString: Str.bytes,
};
