import { type t, Schema } from '../common.ts';
import type * as h from './t.ts';

export const HashJobSchema = {
  initial(dir: t.StringDir): h.HashJob {
    return { dir, saveDist: false };
  },

  validate(value: unknown): h.HashJobCheck {
    const ok = Schema.Value.Check(HashJobSchema.schema, value);
    const errors = ok ? [] : [...Schema.Value.Errors(HashJobSchema.schema, value)];
    if (!ok) return { ok: false, errors };
    return { ok: true, value: value as h.HashJob };
  },

  schema: Schema.Type.Object(
    {
      dir: Schema.Type.String(),
      saveDist: Schema.Type.Optional(Schema.Type.Boolean()),
    },
    { additionalProperties: false },
  ),
} as const;
