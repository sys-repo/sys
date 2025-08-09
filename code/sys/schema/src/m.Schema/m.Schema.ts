import { AssertError } from '@sinclair/typebox/value';
import { Type, type Static } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

import { type t } from './common.ts';
export type { Static };

export { Type, Value };
export const Schema: t.SchemaLib = {
  get Type() {
    return Type;
  },
  get Value() {
    return Value;
  },

  /**
   * Safe try/throw execution for schema related actions:
   */
  try<T>(fn: () => T | undefined) {
    try {
      return { ok: true, value: fn() as T };
    } catch (err) {
      if (err instanceof AssertError) return { ok: false, error: err.error };
      throw err;
    }
  },
} as const;
