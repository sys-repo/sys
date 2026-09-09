import { Type } from './common.ts';
import { remove } from './s.tools.remove.ts';
import { move } from './s.tools.move.ts';
import { copy } from './s.tools.copy.ts';
import { ocr } from './s.tools.ocr.ts';
import { zip } from './s.tools.zip.ts';

/** Profile tools schema fragment. */
export const tools = Type.Optional(
  Type.Object({
    remove,
    move,
    copy,
    ocr,
    zip,
  }, { additionalProperties: false }),
);
