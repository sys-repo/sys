import { Schema } from '@sys/schema';
import { type t, Obj } from './common.ts';

/**
 * Create a validator from a JSON schema.
 * - `check` is a type-guard (boolean only).
 * - `validate` returns { ok:true } or { ok:false, errors:[{path,message}] }.
 *
 * Note:
 *   We intentionally avoid Value.Parse for validation (it may coerce / transform).
 *   Instead we use Value.Check + Value.Errors for strict validation semantics.
 */
export function makeValidator<S extends t.TSchema, TOut = t.Static<S>>(
  schema: S,
): t.Validator<TOut> {
  return {
    /** Strict type-guard using TypeBox's Check (no coercion). */
    check(value: unknown): value is TOut {
      return Schema.Value.Check(schema, value);
    },

    /** Strict validation with normalized error collection. */
    validate(value: unknown) {
      if (Schema.Value.Check(schema, value)) return { ok: true as const };

      // Collect and normalize all validation failures.
      // Convert RFC6901 string pointer -> ObjectPath for our canonical error shape.
      const errors = Array.from(Schema.Value.Errors(schema, value), (e) => ({
        path: Obj.Path.decode(e.path),
        message: e.message,
      })) as ReadonlyArray<t.ValidationError>;

      return { ok: false as const, errors };
    },
  };
}
