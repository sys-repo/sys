import { type t } from './common.ts';
import { Kind, prefix, version } from './m.const.kind.ts';
import { create } from './m.create.ts';
import { IsCursor } from './m.Is.ts';
import { parse } from './m.parse.ts';

/** Cursor codec for paged Files command surfaces. */
export const Cursor: t.Files.Cursor.Lib = {
  prefix,
  version,
  Kind,
  Is: IsCursor,
  create,
  parse,
};
