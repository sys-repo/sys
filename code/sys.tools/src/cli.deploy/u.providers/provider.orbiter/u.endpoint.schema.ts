import { Schema } from '../../common.ts';
import { EndpointSchemaParts } from '../../u.endpoints/u.schema.parts.ts';
import { OrbiterProviderSchema } from './u.schema.ts';

const mapping = Schema.Type.Object(
  {
    dir: EndpointSchemaParts.dir,
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

const mappings = Schema.Type.Array(mapping, { minItems: 0 });

export const OrbiterEndpointSchema = {
  doc: Schema.Type.Object(
    {
      provider: OrbiterProviderSchema.schema,
      source: EndpointSchemaParts.source,
      staging: EndpointSchemaParts.staging,
      mappings: Schema.Type.Optional(mappings),
    },
    { additionalProperties: false },
  ),
} as const;
