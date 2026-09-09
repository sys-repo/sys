import { Type } from './common.ts';

/** Profile prompt schema fragment. */
export const prompt = Type.Optional(
  Type.Object(
    { system: Type.Optional(Type.Union([Type.String({ minLength: 1 }), Type.Null()])) },
    { additionalProperties: false },
  ),
);
