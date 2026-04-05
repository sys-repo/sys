import { type t, Json, Schema } from './common.ts';

const MOUNT_PATTERN = '^[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*$';

/**
 * JSON schema for staged mount index documents.
 */
export const MountSchema = {
  /** Validate a mounts document. */
  validate(value: unknown) {
    const ok = Schema.Value.Check(MountSchema.schema, value);
    const errors = ok ? [] : [...Schema.Value.Errors(MountSchema.schema, value)];
    return { ok: errors.length === 0, errors } as const;
  },

  /** Serialize a mounts document to JSON. */
  stringify(doc: t.SlcDataPipeline.Mounts.Doc): string {
    return `${Json.stringify(doc, 2)}\n`;
  },

  /** JsonSchema for mounts documents. */
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
} as const;
