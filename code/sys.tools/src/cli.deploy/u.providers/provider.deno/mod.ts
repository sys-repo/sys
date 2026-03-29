import { DenoProviderSchema as Schema } from './u.schema.ts';
import { push } from './u.push.ts';
import { resolveTarget } from './u.resolveTarget.ts';
import { Sidecar } from './u.sidecar.ts';
import { stage } from './u.stage.ts';

export const DenoProvider = {
  Schema,
  push,
  resolveTarget,
  Sidecar,
  stage,
} as const;
