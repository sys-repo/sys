import { Schema } from './common.ts';

export const SchemaSlugTreeFs = Schema.Type.Optional(
  Schema.Type.Object(
    {
      source: Schema.Type.Optional(Schema.Type.String()),
      target: Schema.Type.Optional(
        Schema.Type.Object(
          {
            manifest: Schema.Type.Optional(
              Schema.Type.Union([
                Schema.Type.String(),
                Schema.Type.Array(Schema.Type.String(), { minItems: 0 }),
              ]),
            ),
            dir: Schema.Type.Optional(
              Schema.Type.Union([
                Schema.Type.String(),
                Schema.Type.Object(
                  {
                    kind: Schema.Type.Union([
                      Schema.Type.Literal('source'),
                      Schema.Type.Literal('sha256'),
                    ]),
                    path: Schema.Type.String(),
                  },
                  { additionalProperties: false },
                ),
                Schema.Type.Array(
                  Schema.Type.Object(
                    {
                      kind: Schema.Type.Union([
                        Schema.Type.Literal('source'),
                        Schema.Type.Literal('sha256'),
                      ]),
                      path: Schema.Type.String(),
                    },
                    { additionalProperties: false },
                  ),
                  { minItems: 0 },
                ),
              ]),
            ),
            crdt: Schema.Type.Optional(
              Schema.Type.Object(
                {
                  ref: Schema.Type.Optional(Schema.Type.String()),
                  path: Schema.Type.Optional(Schema.Type.String()),
                },
                { additionalProperties: false },
              ),
            ),
          },
          { additionalProperties: false },
        ),
      ),
      include: Schema.Type.Optional(Schema.Type.Array(Schema.Type.String(), { minItems: 0 })),
      ignore: Schema.Type.Optional(Schema.Type.Array(Schema.Type.String(), { minItems: 0 })),
      sort: Schema.Type.Optional(Schema.Type.Boolean()),
      readmeAsIndex: Schema.Type.Optional(Schema.Type.Boolean()),
    },
    { additionalProperties: false },
  ),
);
