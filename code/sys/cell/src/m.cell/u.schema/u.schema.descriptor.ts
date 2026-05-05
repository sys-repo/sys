import { ExportNamePattern, IdPattern, RelativePathPattern, Schema } from './common.ts';

const T = Schema.Type;

const Id = T.String({ pattern: IdPattern });
const CellPath = T.String({ pattern: RelativePathPattern });
const PullConfigPath = T.String({
  pattern: RelativePathPattern,
  description: 'Cell-root-relative path to the @sys/tools/pull owner config YAML.',
});
const LocalViewPath = T.String({
  pattern: RelativePathPattern,
  description: 'Cell-root-relative path to already materialized view files.',
});

const ViewSourcePull = T.Object(
  { pull: PullConfigPath },
  { additionalProperties: false },
);

const ViewSourceLocal = T.Object(
  { local: LocalViewPath },
  { additionalProperties: false },
);

const View = T.Object(
  { source: T.Union([ViewSourcePull, ViewSourceLocal]) },
  { additionalProperties: false },
);

const RuntimeServiceFor = T.Object(
  { views: T.Array(Id, { minItems: 1 }) },
  { additionalProperties: false },
);

const RuntimeService = T.Object(
  {
    name: Id,
    kind: Id,
    for: T.Optional(RuntimeServiceFor),
    from: T.String({ minLength: 1 }),
    export: T.String({ pattern: ExportNamePattern }),
    config: CellPath,
  },
  { additionalProperties: false },
);

export const DescriptorSchema = T.Object(
  {
    kind: T.Literal('cell'),
    version: T.Literal(1),
    dsl: T.Object(
      { root: CellPath },
      { additionalProperties: false },
    ),
    views: T.Optional(T.Record(Id, View)),
    runtime: T.Optional(
      T.Object(
        { services: T.Array(RuntimeService) },
        { additionalProperties: false },
      ),
    ),
  },
  { additionalProperties: false },
);
