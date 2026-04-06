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

export const EndpointSchemaParts = {
  source,
  staging,
  dir,
} as const;
