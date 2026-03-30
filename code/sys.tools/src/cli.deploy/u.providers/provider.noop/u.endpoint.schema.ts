import { Schema } from '../../common.ts';
import { EndpointSchemaParts } from '../../u.endpoints/u.schema.parts.ts';
import { NoopProviderSchema } from './u.schema.ts';

export const NoopEndpointSchema = {
  doc: Schema.Type.Object(
    {
      provider: NoopProviderSchema.schema,
      source: EndpointSchemaParts.source,
      staging: EndpointSchemaParts.staging,
      mappings: Schema.Type.Optional(EndpointSchemaParts.orbiterMappings),
    },
    { additionalProperties: false },
  ),
} as const;
