import { IdPattern, type t } from './common.ts';
import { DescriptorSchema } from './u.schema.descriptor.ts';
import { validateDescriptor } from './u.validate.ts';

const Descriptor = Object.freeze({
  idPattern: IdPattern,
  schema: DescriptorSchema,
  validate: validateDescriptor,
});

export const CellSchema: t.Cell.Schema.Lib = Object.freeze({ Descriptor });
