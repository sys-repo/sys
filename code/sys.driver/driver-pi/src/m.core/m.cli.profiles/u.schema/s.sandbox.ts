import { Type } from './common.ts';

/** Profile sandbox schema fragment. */
export const sandbox = Type.Optional(
  Type.Object(
    {
      capability: Type.Optional(
        Type.Object(
          {
            read: Type.Optional(Type.Array(Type.String())),
            write: Type.Optional(Type.Array(Type.String())),
            env: Type.Optional(Type.Record(Type.String(), Type.String())),
          },
          { additionalProperties: false },
        ),
      ),
      context: Type.Optional(
        Type.Object(
          { append: Type.Optional(Type.Array(Type.String())) },
          { additionalProperties: false },
        ),
      ),
    },
    { additionalProperties: false },
  ),
);
