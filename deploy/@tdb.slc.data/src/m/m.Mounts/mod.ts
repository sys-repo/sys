/**
 * @module
 * Pure document contract for the staged root mounts index.
 */
import { type t, Json, Schema } from './common.ts';

const MOUNT_PATTERN = '^[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*$';

export const Mounts: t.Mounts.Lib = {
  validate(value) {
    const ok = Schema.Value.Check(Mounts.schema, value);
    const errors = ok ? [] : [...Schema.Value.Errors(Mounts.schema, value)];
    return { ok: errors.length === 0, errors } as const;
  },

  stringify(doc) {
    return `${Json.stringify(doc, 2)}\n`;
  },

  schema: Schema.Type.Object(
    {
      mounts: Schema.Type.Array(
        Schema.Type.Object(
          { mount: Schema.Type.String({ pattern: MOUNT_PATTERN }) },
          { additionalProperties: false },
        ),
      ),
    },
    { additionalProperties: false },
  ),
};
