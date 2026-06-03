import { R2EndpointSchema as EndpointSchema } from './u.endpoint.schema.ts';
import { push } from './u.push.ts';
import { R2ProviderSchema as Schema } from './u.schema.ts';

export const R2Provider = {
  EndpointSchema,
  Schema,
  push,
} as const;
