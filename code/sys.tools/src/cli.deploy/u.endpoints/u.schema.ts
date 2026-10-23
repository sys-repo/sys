import { Schema, type t } from '../common.ts';
import { NoopProvider, R2Provider } from '../u.providers/mod.ts';
import { EndpointSchemaParts } from './u.schema.parts.ts';

const ProviderSchema = Schema.Type.Union([
  NoopProvider.Schema.schema,
  R2Provider.Schema.schema,
]);

const DocumentSchema = Schema.Type.Object(
  {
    provider: Schema.Type.Optional(ProviderSchema),
    source: EndpointSchemaParts.source,
    staging: EndpointSchemaParts.staging,
    mappings: Schema.Type.Optional(EndpointSchemaParts.mappings),
  },
  { additionalProperties: false },
);

/**
 * Validate and construct authoritative endpoint YAML documents.
 */
export const EndpointYamlSchema = {
  /** Construct the canonical providerless initial document. */
  initial(): t.DeployTool.Config.EndpointYaml.Doc {
    return { staging: { dir: './staging' }, mappings: [] };
  },

  /** Validate strictly without coercion. */
  validate(value: unknown) {
    const ok = Schema.Value.Check(EndpointYamlSchema.schema, value);
    const errors = ok ? [] : [...Schema.Value.Errors(EndpointYamlSchema.schema, value)];
    return { ok, errors } as const;
  },

  /** Authoritative endpoint JsonSchema. */
  schema: DocumentSchema,
} as const;
