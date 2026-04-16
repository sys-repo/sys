import { type t, Schema, Yaml } from '../common.ts';

const MOUNT_PATTERN = '^[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*$';

/**
 * YAML schema for staged-data profiles.
 */
export const StageProfileSchema = {
  /** Create the initial stage profile document. */
  initial(mount: t.StringId): t.SlcDataCli.StageProfile.Doc {
    return {
      mappings: [{ kind: 'folder', mount, source: '.' }],
    };
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
  initialYaml(mount: t.StringId): string {
    return StageProfileSchema.stringify(StageProfileSchema.initial(mount));
  },

  /** JsonSchema for stage profile documents. */
  schema: Schema.Type.Object(
    {
      mappings: Schema.Type.Array(
        Schema.Type.Union(
          [
            Schema.Type.Object(
              {
                kind: Schema.Type.Optional(Schema.Type.Literal('folder')),
                mount: Schema.Type.String({ pattern: MOUNT_PATTERN }),
                source: Schema.Type.String(),
              },
              { additionalProperties: false },
            ),
            Schema.Type.Object(
              {
                kind: Schema.Type.Literal('slug-dataset'),
                source: Schema.Type.String(),
              },
              { additionalProperties: false },
            ),
          ],
        ),
        { minItems: 1 },
      ),
    },
    { additionalProperties: false },
  ),
} as const;
