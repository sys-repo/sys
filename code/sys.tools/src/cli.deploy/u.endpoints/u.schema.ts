import { type t, Schema } from '../common.ts';
import { DenoProvider, NoopProvider, OrbiterProvider } from '../u.providers/mod.ts';
import { EndpointSchemaParts } from './u.schema.parts.ts';

const GenericDocSchema = Schema.Type.Object(
  {
    source: EndpointSchemaParts.source,
    staging: EndpointSchemaParts.staging,
    mappings: Schema.Type.Optional(EndpointSchemaParts.orbiterMappings),
  },
  { additionalProperties: false },
);

/**
 * Endpoint YAML schema (authoritative config).
 * Runtime validated via JsonSchema (typebox) Value.Check/Errors.
 */
export const EndpointYamlSchema = {
  /**
   * Typed initial document.
   * (YAML can omit optionals; but having explicit defaults is fine.)
   */
  initial(): t.DeployTool.Config.EndpointYaml.Doc {
    return { staging: { dir: './staging' }, mappings: [] };
  },

  /**
   * Runtime validation (strict, no coercion).
   */
  validate(value: unknown) {
    const ok = Schema.Value.Check(EndpointYamlSchema.schema, value);
    const errors = ok ? [] : [...Schema.Value.Errors(EndpointYamlSchema.schema, value)];
    return { ok, errors } as const;
  },

  /**
   * JsonSchema.
   */
  schema: Schema.Type.Union([
    GenericDocSchema,
    OrbiterProvider.EndpointSchema.doc,
    NoopProvider.EndpointSchema.doc,
    DenoProvider.EndpointSchema.doc,
  ]),
} as const;
