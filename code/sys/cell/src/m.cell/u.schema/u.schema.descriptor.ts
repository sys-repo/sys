import { EndpointNamePattern, IdPattern, RelativePathPattern, Schema } from './common.ts';

const T = Schema.Type;

const Id = T.String({ pattern: IdPattern });
const CellPath = T.String({ pattern: RelativePathPattern });
const Timeout = T.Integer({ minimum: 1 });

const EndpointSelector = {
  use: T.String({ pattern: EndpointNamePattern }),
};

const ServiceBinding = T.Object(
  {
    ...EndpointSelector,
    from: T.String({ minLength: 1 }),
    config: CellPath,
    timeout: T.Optional(Timeout),
  },
  { additionalProperties: false },
);

const Service = T.Object(
  {
    name: Id,
    ...EndpointSelector,
    from: T.String({ minLength: 1 }),
    config: CellPath,
    timeout: T.Optional(Timeout),
    variants: T.Optional(T.Record(Id, ServiceBinding)),
  },
  { additionalProperties: false },
);

const TaskLeaf = T.Object(
  {
    name: Id,
    ...EndpointSelector,
    from: T.String({ minLength: 1 }),
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
    name: T.Optional(Id),
    services: T.Optional(T.Array(Service)),
    tasks: T.Optional(T.Array(Task)),
  },
  { additionalProperties: false },
);
