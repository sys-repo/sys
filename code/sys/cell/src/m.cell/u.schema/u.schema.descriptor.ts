import { ExportNamePattern, IdPattern, RelativePathPattern, Schema } from './common.ts';

const T = Schema.Type;

const Id = T.String({ pattern: IdPattern });
const CellPath = T.String({ pattern: RelativePathPattern });

const RuntimeService = T.Object(
  {
    name: Id,
    from: T.String({ minLength: 1 }),
    export: T.String({ pattern: ExportNamePattern }),
    config: CellPath,
  },
  { additionalProperties: false },
);

const ActionLeaf = T.Object(
  {
    name: Id,
    from: T.String({ minLength: 1 }),
    export: T.String({ pattern: ExportNamePattern }),
    config: T.Optional(CellPath),
  },
  { additionalProperties: false },
);

const ActionStep = T.Object(
  { action: Id },
  { additionalProperties: false },
);

const ActionComposite = T.Object(
  {
    name: Id,
    steps: T.Array(ActionStep, { minItems: 1 }),
  },
  { additionalProperties: false },
);

const Action = T.Union([ActionLeaf, ActionComposite]);

export const DescriptorSchema = T.Object(
  {
    kind: T.Literal('cell'),
    version: T.Literal(1),
    runtime: T.Optional(
      T.Object(
        { services: T.Array(RuntimeService) },
        { additionalProperties: false },
      ),
    ),
    actions: T.Optional(T.Array(Action)),
  },
  { additionalProperties: false },
);
