import { type t, Schema, Yaml } from '../common.ts';

const MOUNT_PATTERN = '^[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*$';

/**
 * YAML schema for staged-data profiles.
 */
export const StageProfileSchema = {
  /** Create the initial stage profile document. */
  initial(mount = 'sample-1' as t.StringId): t.SlcDataCli.StageProfile.Doc {
    return { source: '.', mount };
  },

  /** Validate a stage profile document. */
  validate(value: unknown) {
    const ok = Schema.Value.Check(StageProfileSchema.schema, value);
    const errors = ok ? [] : [...Schema.Value.Errors(StageProfileSchema.schema, value)];
    return { ok: errors.length === 0, errors } as const;
  },

  /** Serialize a stage profile document to YAML. */
  stringify(doc: t.SlcDataCli.StageProfile.Doc): string {
    return Yaml.stringify(doc).data ?? '';
  },

  /** Serialize the initial stage profile document to YAML. */
  initialYaml(mount = 'sample-1' as t.StringId): string {
    return StageProfileSchema.stringify(StageProfileSchema.initial(mount));
  },

  /** JsonSchema for stage profile documents. */
  schema: Schema.Type.Object(
    {
      source: Schema.Type.String(),
      mount: Schema.Type.String({ pattern: MOUNT_PATTERN }),
    },
    { additionalProperties: false },
  ),
} as const;
