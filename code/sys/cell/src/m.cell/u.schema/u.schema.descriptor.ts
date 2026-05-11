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
  },
  { additionalProperties: false },
);
