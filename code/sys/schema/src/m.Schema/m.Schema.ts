import { Type, type Static } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

import { type t } from './common.ts';
import { asStandardSchema, isStandardSchema, toStandardSchema } from './u.StdSchema.ts';
import { tryValidate } from './u.try.ts';

export { Type, Value };
export type { Static };

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
} as const;
