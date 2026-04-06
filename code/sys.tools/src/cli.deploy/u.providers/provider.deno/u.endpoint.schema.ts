import { Schema } from '../../common.ts';
import { EndpointSchemaParts } from '../../u.endpoints/u.schema.parts.ts';
import { DenoProviderSchema } from './u.schema.ts';

const mapping = Schema.Type.Object(
  {
    dir: EndpointSchemaParts.dir,
  },
  { additionalProperties: false },
);

export const DenoEndpointSchema = {
  doc: Schema.Type.Object(
    {
      provider: DenoProviderSchema.schema,
      source: EndpointSchemaParts.source,
      staging: EndpointSchemaParts.staging,
      mapping,
    },
    { additionalProperties: false },
  ),
} as const;
