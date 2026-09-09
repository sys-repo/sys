import { Schema, type t } from './common.ts';

const Type = Schema.Type;

/**
 * Schema for wrapper-owned Pi settings.
 */
export const PiSettingsSchema = {
  initial(): t.PiSettings.Doc {
    return {
      quietStartup: true,
      collapseChangelog: true,
    };
  },

  validate(value: unknown): t.PiSettings.JsonCheck {
    const ok = Schema.Value.Check(PiSettingsSchema.schema, value);
    const errors = ok ? [] : [...Schema.Value.Errors(PiSettingsSchema.schema, value)];
    return ok ? { ok: true, doc: value as t.PiSettings.Doc } : { ok: false, errors };
  },

  schema: Type.Object(
    { quietStartup: Type.Boolean(), collapseChangelog: Type.Boolean() },
    { additionalProperties: false },
  ),
} as const;
