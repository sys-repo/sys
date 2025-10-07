import { Str } from './common.ts';
import type { FileSizeLib } from './t.ts';

export const FileSize: FileSizeLib = {
  toString: Str.bytes,
};
