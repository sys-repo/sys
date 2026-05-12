import { ExportNamePattern, IdPattern, RelativePathPattern, Schema } from './common.ts';

const T = Schema.Type;

const Id = T.String({ pattern: IdPattern });
const CellPath = T.String({ pattern: RelativePathPattern });

const Service = T.Object(
  {
    name: Id,
    from: T.String({ minLength: 1 }),
    export: T.String({ pattern: ExportNamePattern }),
    config: CellPath,
  },
  { additionalProperties: false },
);

const TaskLeaf = T.Object(
  {
    name: Id,
    from: T.String({ minLength: 1 }),
    export: T.String({ pattern: ExportNamePattern }),
    config: T.Optional(CellPath),
  },
  { additionalProperties: false },
);

const TaskStep = T.Object(
  { task: Id },
  { additionalProperties: false },
);

const TaskComposite = T.Object(
  {
    name: Id,
    steps: T.Array(TaskStep, { minItems: 1 }),
  },
  { additionalProperties: false },
);

const Task = T.Union([TaskLeaf, TaskComposite]);

export const DescriptorSchema = T.Object(
  {
    kind: T.Literal('cell'),
    version: T.Literal(1),
    services: T.Optional(T.Array(Service)),
    tasks: T.Optional(T.Array(Task)),
  },
  { additionalProperties: false },
);
