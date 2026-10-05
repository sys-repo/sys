import { Schema } from '../common.ts';
import { mappingStagingPattern, sourcePathPattern, stagingRootPattern } from './u.pathPolicy.ts';

const sourcePath = Schema.Type.String({ minLength: 1, pattern: sourcePathPattern });
const source = Schema.Type.Optional(
  Schema.Type.Object(
    { dir: Schema.Type.Union([Schema.Type.Literal('.'), sourcePath]) },
    { additionalProperties: false },
  ),
);

const staging = Schema.Type.Object(
  {
    dir: Schema.Type.String({ minLength: 1, pattern: stagingRootPattern }),
    serve: Schema.Type.Optional(
      Schema.Type.Object(
        { port: Schema.Type.Optional(Schema.Type.Integer({ minimum: 1, maximum: 65535 })) },
        { additionalProperties: false },
      ),
    ),
    html: Schema.Type.Optional(
      Schema.Type.Object(
        { buildReset: Schema.Type.Optional(Schema.Type.Boolean()) },
        { additionalProperties: false },
      ),
    ),
  },
  { additionalProperties: false },
);

const stagingPath = Schema.Type.Union([
  Schema.Type.Literal('.'),
  Schema.Type.String({ minLength: 1, pattern: mappingStagingPattern }),
]);
const dir = Schema.Type.Object(
  { source: sourcePath, staging: stagingPath },
  { additionalProperties: false },
);
const indexDir = Schema.Type.Object(
  { source: stagingPath, staging: stagingPath },
  { additionalProperties: false },
);

const shardTotal = Schema.Type.Integer({
  minimum: 1,
  maximum: Number.MAX_SAFE_INTEGER,
});

const shards = Schema.Type.Optional(
  Schema.Type.Object(
    {
      total: shardTotal,
      requireAll: Schema.Type.Optional(Schema.Type.Boolean()),
    },
    { additionalProperties: false },
  ),
);
const mapping = Schema.Type.Union([
  Schema.Type.Object(
    { dir, mode: Schema.Type.Literal('copy'), shards },
    { additionalProperties: false },
  ),
  Schema.Type.Object(
    { dir, mode: Schema.Type.Literal('build+copy'), shards },
    { additionalProperties: false },
  ),
  Schema.Type.Object(
    { dir: indexDir, mode: Schema.Type.Literal('index'), shards },
    { additionalProperties: false },
  ),
]);

const mappings = Schema.Type.Array(mapping, { minItems: 0 });

/**
 * Strict reusable schema parts for Deploy endpoint YAML.
 */
export const EndpointSchemaParts = {
  source,
  staging,
  mappings,
} as const;
