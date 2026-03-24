import { Schema, type t } from './common.ts';

const DenoInfoSpecifierSchema = Schema.Type.Object(
  {
    specifier: Schema.Type.Optional(Schema.Type.String()),
  },
  { additionalProperties: true },
);

const DenoInfoDependencySchema = Schema.Type.Object(
  {
    code: Schema.Type.Optional(DenoInfoSpecifierSchema),
    type: Schema.Type.Optional(DenoInfoSpecifierSchema),
  },
  { additionalProperties: true },
);

const DenoInfoModuleSchema = Schema.Type.Object(
  {
    specifier: Schema.Type.Optional(Schema.Type.String()),
    dependencies: Schema.Type.Optional(Schema.Type.Array(DenoInfoDependencySchema)),
  },
  { additionalProperties: true },
);

const DenoInfoJsonSchema = Schema.Type.Object(
  {
    roots: Schema.Type.Optional(Schema.Type.Array(Schema.Type.String())),
    modules: Schema.Type.Optional(Schema.Type.Array(DenoInfoModuleSchema)),
  },
  { additionalProperties: true },
);

/**
 * Validate the internal `deno info --json` adapter shape.
 *
 * Keep this schema intentionally partial:
 * - strict about the fields the workspace graph relies on
 * - permissive about unrelated extra fields Deno may add
 */
export function validateInfoJson(value: unknown): t.WorkspaceGraphCli.InfoJson {
  if (Schema.Value.Check(DenoInfoJsonSchema, value)) {
    return value as t.WorkspaceGraphCli.InfoJson;
  }

  const message = Array.from(Schema.Value.Errors(DenoInfoJsonSchema, value))
    .slice(0, 3)
    .map((error) => `${error.path || '<root>'}: ${error.message}`)
    .join('; ');
  throw new Error(`Workspace.Graph.collect: unsupported deno info json shape: ${message}`);
}
