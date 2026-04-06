import { Schema } from '../../common.ts';

export const SidecarSchema = Schema.Type.Object(
  {
    target: Schema.Type.Object({
      dir: Schema.Type.String(),
    }, { additionalProperties: false }),
    workspace: Schema.Type.Object({
      dir: Schema.Type.String(),
    }, { additionalProperties: false }),
    root: Schema.Type.String(),
    entry: Schema.Type.String(),
  },
  { additionalProperties: false },
);
