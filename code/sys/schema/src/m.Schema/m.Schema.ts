import { type t, Type, Value } from './common.ts';

import { Error } from './m.Error.ts';
import { asStandardSchema, isStandardSchema, toStandardSchema } from './u.StdSchema.ts';
import { tryValidate } from './u.try.ts';

export { Type, Value };

export const Schema: t.SchemaLib = {
  try: tryValidate,

  // https://standardschema.dev
  asStandardSchema,
  isStandardSchema,
  toStandardSchema,

  get Type() {
    return Type;
  },
  get Value() {
    return Value;
  },
  get Error() {
    return Error;
  },
};
