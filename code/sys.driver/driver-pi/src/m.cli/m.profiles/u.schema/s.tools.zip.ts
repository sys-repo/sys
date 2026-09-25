import { Type } from './common.ts';

/** ZIP reads are default-on; extraction requires explicit cooperative opt-in. */
export const zip = Type.Optional(Type.Union([
  Type.Object({ enabled: Type.Optional(Type.Boolean()) }, { additionalProperties: false }),
  Type.Object(
    { enabled: Type.Literal(true), extract: Type.Literal('cooperative') },
    { additionalProperties: false },
  ),
]));
