import { Schema } from '../../common.ts';
import { EndpointSchemaParts } from '../../u.endpoints/u.schema.parts.ts';
import { OrbiterProviderSchema } from './u.schema.ts';

export const OrbiterEndpointSchema = {
  doc: Schema.Type.Object(
    {
      provider: OrbiterProviderSchema.schema,
      source: EndpointSchemaParts.source,
      staging: EndpointSchemaParts.staging,
      mappings: Schema.Type.Optional(EndpointSchemaParts.orbiterMappings),
    },
    { additionalProperties: false },
  ),
} as const;
