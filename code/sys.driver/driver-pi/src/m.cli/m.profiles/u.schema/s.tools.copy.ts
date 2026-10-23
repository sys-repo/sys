import { Type } from './common.ts';

/** Profile schema fragment for the copy tool. */
export const copy = Type.Optional(
  Type.Object(
    { enabled: Type.Optional(Type.Boolean()) },
    { additionalProperties: false },
  ),
);
