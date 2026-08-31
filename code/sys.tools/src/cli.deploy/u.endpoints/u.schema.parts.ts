import { Schema } from '../common.ts';

const source = Schema.Type.Optional(
  Schema.Type.Object(
    { dir: Schema.Type.Union([Schema.Type.Literal('.'), Schema.Type.String()]) },
    { additionalProperties: false },
  ),
);

const staging = Schema.Type.Object(
  {
    dir: Schema.Type.Union([Schema.Type.Literal('.'), Schema.Type.String()]),
    clear: Schema.Type.Optional(Schema.Type.Boolean()),
    serve: Schema.Type.Optional(
      Schema.Type.Object(
        { port: Schema.Type.Optional(Schema.Type.Number({ minimum: 1, maximum: 65535 })) },
        { additionalProperties: false },
      ),
    ),
    html: Schema.Type.Optional(
      Schema.Type.Object(
        { buildReset: Schema.Type.Optional(Schema.Type.Boolean()) },
        { additionalProperties: false },
      ),
    ),
  },
  { additionalProperties: false },
);

const dir = Schema.Type.Object(
  {
    source: Schema.Type.String(),
    staging: Schema.Type.Union([Schema.Type.Literal('.'), Schema.Type.String()]),
  },
  { additionalProperties: false },
);

const shardTotal = Schema.Type.Integer({
  minimum: 1,
  maximum: Number.MAX_SAFE_INTEGER,
});

const mapping = Schema.Type.Object(
  {
    dir,
    mode: Schema.Type.Union([
      Schema.Type.Literal('copy'),
      Schema.Type.Literal('build+copy'),
      Schema.Type.Literal('index'),
    ]),
    shards: Schema.Type.Optional(
      Schema.Type.Object(
        {
          total: shardTotal,
          requireAll: Schema.Type.Optional(Schema.Type.Boolean()),
        },
        { additionalProperties: false },
      ),
    ),
  },
  { additionalProperties: false },
);

const mappings = Schema.Type.Array(mapping, { minItems: 0 });

export const EndpointSchemaParts = {
  source,
  staging,
  mappings,
} as const;
