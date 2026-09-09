import { Schema, type t } from '../common.ts';

const RelativeDirSchema = Schema.Type.String({
  pattern:
    '^(?!.*[\\u0000-\\u001f\\u007f-\\u009f])(?!.*\\\\)(?![~/\\\\])(?![A-Za-z]:)(?!\\.{1,2}$)(?!\\.\\.[/\\\\])(?!.*[/\\\\]\\.\\.(?:[/\\\\]|$)).+$',
});

const MutationModeSchema = Schema.Type.Union([
  Schema.Type.Literal('create'),
  Schema.Type.Literal('replace'),
]);

const MutableTargetSchema = Schema.Type.Object(
  {
    dir: RelativeDirSchema,
    mode: MutationModeSchema,
  },
  { additionalProperties: false },
);

const PositiveSafeIntegerSchema = Schema.Type.Integer({
  minimum: 1,
  maximum: Number.MAX_SAFE_INTEGER,
});

const GithubLimitsSchema = Schema.Type.Object(
  {
    metadataBytes: PositiveSafeIntegerSchema,
    entries: PositiveSafeIntegerSchema,
    fileBytes: PositiveSafeIntegerSchema,
    totalBytes: PositiveSafeIntegerSchema,
    totalTime: PositiveSafeIntegerSchema,
  },
  { additionalProperties: false },
);

const GithubBundleSharedSchema = {
  repo: Schema.Type.String({
    pattern: '^(?!\\.{1,2}/)(?![A-Za-z0-9_.-]+/\\.{1,2}$)[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$',
  }),
  local: MutableTargetSchema,
  limits: GithubLimitsSchema,
} as const;

const BundleDistSchema = Schema.Type.Object(
  {
    kind: Schema.Type.Literal('dist'),
    manifest: Schema.Type.String({ pattern: '^https?://[^\\s]+$' }),
    integrity: Schema.Type.String({ pattern: '^sha256-[0-9a-f]{64}$' }),
    store: RelativeDirSchema,
    project: Schema.Type.Optional(MutableTargetSchema),
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
      bundles: Schema.Type.Optional(
        Schema.Type.Array(
          Schema.Type.Union([BundleDistSchema, BundleGithubReleaseSchema, BundleGithubRepoSchema]),
        ),
      ),
    },
    { additionalProperties: false },
  ),
} as const;
