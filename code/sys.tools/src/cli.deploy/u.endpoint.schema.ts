import { type t, Schema } from './common.ts';

/**
 * Endpoint YAML schema (authoritative config).
 * Runtime validated via TypeBox Value.Check/Errors.
 */
export const EndpointYamlSchema = {
  /**
   * TypeBox schema.
   * Keep it additive; avoid cleverness.
   */
  schema: Schema.Type.Object(
    {
      provider: Schema.Type.Optional(Schema.Type.Unknown()), // TODO: tighten once DeployProvider schema exists.
      mappings: Schema.Type.Optional(
        Schema.Type.Array(
          Schema.Type.Object(
            {
              dir: Schema.Type.Object(
                {
                  source: Schema.Type.String(),
                  staging: Schema.Type.Union([Schema.Type.Literal('.'), Schema.Type.String()]),
                },
                { additionalProperties: false },
              ),
              mode: Schema.Type.Union([
                Schema.Type.Literal('copy'),
                Schema.Type.Literal('build+copy'),
              ]),
            },
            { additionalProperties: false },
          ),
          { minItems: 0 },
        ),
      ),
    },
    { additionalProperties: false },
  ),

  /**
   * Typed initial document.
   * (YAML can omit optionals; but having explicit defaults is fine.)
   */
  initial(): t.DeployTool.Config.EndpointYaml.Doc {
    return { mappings: [] };
  },

  /**
   * Runtime validation (strict, no coercion).
   */
  validate(value: unknown) {
    const ok = Schema.Value.Check(EndpointYamlSchema.schema, value);
    const errors = ok ? [] : [...Schema.Value.Errors(EndpointYamlSchema.schema, value)];
    return { ok, errors } as const;
  },
} as const;
