import { Schema, type t } from '../common.ts';

const BundleSharedSchema = {
  local: Schema.Type.Object(
    {
      dir: Schema.Type.String(),
      clear: Schema.Type.Optional(Schema.Type.Boolean()),
    },
    { additionalProperties: false },
  ),
  lastUsedAt: Schema.Type.Optional(Schema.Type.Number()),
} as const;

const GithubBundleSharedSchema = {
  repo: Schema.Type.String({ pattern: '^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$' }),
  ...BundleSharedSchema,
} as const;

const BundleHttpSchema = Schema.Type.Object(
  {
    kind: Schema.Type.Literal('http'),
    dist: Schema.Type.String(),
    ...BundleSharedSchema,
  },
  { additionalProperties: false },
);

const BundleGithubReleaseSchema = Schema.Type.Object(
  {
    kind: Schema.Type.Literal('github:release'),
    ...GithubBundleSharedSchema,
    tag: Schema.Type.Optional(Schema.Type.String()),
    asset: Schema.Type.Optional(
      Schema.Type.Union([
        Schema.Type.String(),
        Schema.Type.Array(Schema.Type.String(), { minItems: 1 }),
      ]),
    ),
  },
  { additionalProperties: false },
);

const BundleGithubRepoSchema = Schema.Type.Object(
  {
    kind: Schema.Type.Literal('github:repo'),
    ...GithubBundleSharedSchema,
    ref: Schema.Type.Optional(Schema.Type.String()),
    path: Schema.Type.Optional(Schema.Type.String()),
  },
  { additionalProperties: false },
);

export const PullYamlSchema = {
  initial(): t.PullTool.ConfigYaml.Doc {
    return { dir: '.' };
  },

  validate(value: unknown) {
    const ok = Schema.Value.Check(PullYamlSchema.schema, value);
    const errors = ok ? [] : [...Schema.Value.Errors(PullYamlSchema.schema, value)];
    return { ok, errors } as const;
  },

  schema: Schema.Type.Object(
    {
      dir: Schema.Type.Union([Schema.Type.Literal('.'), Schema.Type.String()]),
      defaults: Schema.Type.Optional(
        Schema.Type.Object(
          {
            local: Schema.Type.Optional(
              Schema.Type.Object(
                {
                  clear: Schema.Type.Optional(Schema.Type.Boolean()),
                },
                { additionalProperties: false },
              ),
            ),
          },
          { additionalProperties: false },
        ),
      ),
      bundles: Schema.Type.Optional(
        Schema.Type.Array(
          Schema.Type.Union([BundleHttpSchema, BundleGithubReleaseSchema, BundleGithubRepoSchema]),
        ),
      ),
    },
    { additionalProperties: false },
  ),
} as const;
