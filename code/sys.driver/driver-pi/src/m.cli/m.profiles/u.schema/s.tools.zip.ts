import { Type } from './common.ts';

/** Profile schema fragment for the read-only ZIP tools. */
export const zip = Type.Optional(
  Type.Object(
    { enabled: Type.Optional(Type.Boolean()) },
    { additionalProperties: false },
  ),
);
