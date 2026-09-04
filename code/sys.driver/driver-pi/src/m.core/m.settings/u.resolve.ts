import type { t } from './common.ts';
import { PiSettingsSchema } from './u.schema.ts';

/**
 * Resolve wrapper-owned Pi settings from deterministic defaults.
 */
export function resolve(input: t.PiSettings.ResolveInput = {}): t.PiSettings.Doc {
  return {
    ...PiSettingsSchema.initial(),
    ...input,
  };
}
