import { NoopEndpointSchema as EndpointSchema } from './u.endpoint.schema.ts';
import { NoopProviderSchema as Schema } from './u.schema.ts';

export const NoopProvider = {
  EndpointSchema,
  Schema,
} as const;
