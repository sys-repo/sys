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

const orbiterMapping = Schema.Type.Object(
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
          total: Schema.Type.Number(),
          requireAll: Schema.Type.Optional(Schema.Type.Boolean()),
        },
        { additionalProperties: false },
      ),
    ),
  },
  { additionalProperties: false },
);

const orbiterMappings = Schema.Type.Array(orbiterMapping, { minItems: 0 });
const denoMapping = Schema.Type.Object({ dir }, { additionalProperties: false });

export const EndpointSchemaParts = {
  source,
  staging,
  dir,
  orbiterMapping,
  orbiterMappings,
  denoMapping,
} as const;
