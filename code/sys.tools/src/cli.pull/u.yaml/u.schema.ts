import { Is, Pkg, Schema, type t, Url } from '../common.ts';

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
    pin: Schema.Type.Unknown(),
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
    if (!Schema.Value.Check(PullYamlSchema.schema, value)) {
      return { ok: false, errors: [...Schema.Value.Errors(PullYamlSchema.schema, value)] } as const;
    }
    const errors: t.Schema.Value.Error[] = [];
    for (const [index, bundle] of (value.bundles ?? []).entries()) {
      if (bundle.kind !== 'dist') continue;
      if (!isManifestUrl(bundle.manifest)) {
        errors.push(...fieldErrors(
          bundle.manifest,
          `/bundles/${index}/manifest`,
          'Expected an absolute HTTP(S) Dist manifest URL without userinfo.',
        ));
      }
      // Pkg owns pin semantics; schema diagnostics only locate the refusal in authored YAML.
      if (!Pkg.Is.distPin(bundle.pin)) {
        errors.push(...fieldErrors(
          bundle.pin,
          `/bundles/${index}/pin`,
          'Expected an independent canonical Dist content pin.',
        ));
      }
    }
    return { ok: errors.length === 0, errors } as const;
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

/** Match execution's source admission before any configured bundle can acquire content. */
function isManifestUrl(input: string): boolean {
  if (!Is.urlString(input)) return false;
  const parsed = Url.parse(input);
  if (!parsed.ok) return false;
  const url = parsed.toURL();
  return !url.username && !url.password;
}

function fieldErrors(value: unknown, path: string, message: string): t.Schema.Value.Error[] {
  return [...Schema.Value.Errors(Schema.Type.Never(), value)].map((error) => ({
    ...error,
    path,
    message,
  }));
}
