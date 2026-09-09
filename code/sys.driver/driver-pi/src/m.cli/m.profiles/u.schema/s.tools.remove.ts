import { Type } from './common.ts';

/** Profile schema fragment for the remove tool. */
export const remove = Type.Optional(
  Type.Object(
    {
      enabled: Type.Optional(Type.Boolean()),
      recursive: Type.Optional(Type.Boolean()),
    },
    { additionalProperties: false },
  ),
);
