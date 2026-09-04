import { Type } from './common.ts';
import { ocr } from './s.ocr.ts';

/** Profile tools schema fragment. */
export const tools = Type.Optional(
  Type.Object(
    {
      remove: Type.Optional(
        Type.Object(
          {
            enabled: Type.Optional(Type.Boolean()),
            recursive: Type.Optional(Type.Boolean()),
          },
          { additionalProperties: false },
        ),
      ),
      move: Type.Optional(
        Type.Object(
          { enabled: Type.Optional(Type.Boolean()) },
          { additionalProperties: false },
        ),
      ),
      copy: Type.Optional(
        Type.Object(
          { enabled: Type.Optional(Type.Boolean()) },
          { additionalProperties: false },
        ),
      ),
      ocr,
    },
    { additionalProperties: false },
  ),
);
