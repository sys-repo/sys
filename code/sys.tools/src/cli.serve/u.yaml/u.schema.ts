import { type t, Schema } from '../common.ts';

/**
 * Serve location YAML schema (authoritative config).
 * Runtime validated via JsonSchema (typebox) Value.Check/Errors.
 */
export const ServeYamlSchema = {
  /**
   * Typed initial document.
   * Minimal: just name and dir. contentTypes omitted (defaults to all MIME types at runtime).
   */
  initial(name = 'My Server'): t.ServeTool.LocationYaml.Doc {
    return { name, dir: '.' };
  },

  /**
   * Runtime validation (strict, no coercion).
   */
  validate(value: unknown) {
    const ok = Schema.Value.Check(ServeYamlSchema.schema, value);
    const errors = ok ? [] : [...Schema.Value.Errors(ServeYamlSchema.schema, value)];
    return { ok, errors } as const;
  },

  /**
   * JsonSchema.
   */
  schema: Schema.Type.Object(
    {
      name: Schema.Type.String(),
      dir: Schema.Type.Union([Schema.Type.Literal('.'), Schema.Type.String()]),
      contentTypes: Schema.Type.Optional(Schema.Type.Array(Schema.Type.String())),
      remoteBundles: Schema.Type.Optional(
        Schema.Type.Array(
          Schema.Type.Object(
            {
              remote: Schema.Type.Object(
                { dist: Schema.Type.String() },
                { additionalProperties: false },
              ),
              local: Schema.Type.Object(
                { dir: Schema.Type.String() },
                { additionalProperties: false },
              ),
              lastUsedAt: Schema.Type.Optional(Schema.Type.Number()),
            },
            { additionalProperties: false },
          ),
        ),
      ),
    },
    { additionalProperties: false },
  ),
} as const;
