import { DenoEndpointSchema as EndpointSchema } from './u.endpoint.schema.ts';
import { DenoProviderSchema as Schema } from './u.schema.ts';
import { push } from './u.push.ts';
import { resolveTarget } from './u.resolveTarget.ts';
import { Sidecar } from './u.sidecar.ts';
import { stage } from './u.stage.ts';

export const DenoProvider = {
  EndpointSchema,
  Schema,
  push,
  resolveTarget,
  Sidecar,
  stage,
} as const;
