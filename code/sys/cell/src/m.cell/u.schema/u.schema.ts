import { type t, IdPattern } from './common.ts';
import { DescriptorSchema } from './u.schema.descriptor.ts';
import { validateDescriptor } from './u.validate.ts';

export const CellSchema: t.Cell.Schema.Lib = {
  Descriptor: {
    idPattern: IdPattern,
    schema: DescriptorSchema,
    validate: validateDescriptor,
  },
} as const;
