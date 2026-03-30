import { Schema } from '../../common.ts';
import { EndpointSchemaParts } from '../../u.endpoints/u.schema.parts.ts';
import { DenoProviderSchema } from './u.schema.ts';

export const DenoEndpointSchema = {
  doc: Schema.Type.Object(
    {
      provider: DenoProviderSchema.schema,
      source: EndpointSchemaParts.source,
      staging: EndpointSchemaParts.staging,
      mapping: EndpointSchemaParts.denoMapping,
    },
    { additionalProperties: false },
  ),
} as const;
