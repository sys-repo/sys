import { Type } from './common.ts';

/** Profile schema fragment for the move tool. */
export const move = Type.Optional(
  Type.Object(
    { enabled: Type.Optional(Type.Boolean()) },
    { additionalProperties: false },
  ),
);
