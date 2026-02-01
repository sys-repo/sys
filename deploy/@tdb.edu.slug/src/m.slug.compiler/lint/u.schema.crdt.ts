import { Schema } from './common.ts';

export const SchemaCrdtConfig = Schema.Type.Object(
  {
    docid: Schema.Type.String(),
    path: Schema.Type.String(),
  },
  { additionalProperties: false },
);
