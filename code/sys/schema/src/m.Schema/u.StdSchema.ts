import { Value } from '@sinclair/typebox/value';
import { type t, D, Obj } from './common.ts';

/**
 * Wrap a JSON Schema (TypeBox) with the Standard Schema v1 interface.
 * - Pure adapter (no mutation of the original schema).
 * - Strict semantics: uses Value.Check / Value.Errors (no coercion).
 * - `vendor` defaults to "sys".
 */
export function toStandardSchema<S extends t.TSchema, TOut = t.Static<S>>(
  schema: S,
  vendor = D.StdSchema.vendor,
): t.StandardSchemaV1<unknown, TOut> {
  return {
    '~standard': {
      version: '1.0.0',
      vendor,
      validate(value: unknown) {
        if (Value.Check(schema, value)) {
          return { ok: true, value: value as TOut };
        }

        const issues = Array.from(Value.Errors(schema, value), (e): t.StandardSchemaIssue => {
          // RFC 6901 pointer → [ObjectPath] via canonical std codec:
          return {
            path: Obj.Path.decode(e.path, { numeric: true }), // '' → [], '/a/0' → ['a', 0],
            message: e.message,
          };
        }) as readonly t.StandardSchemaIssue[];

        return { ok: false, issues };
      },
    },
  } satisfies t.StandardSchemaV1<unknown, TOut>;
}

/**
 * Type guard: returns true if the value is a Standard Schema v1 object.
 */
export function isStandardSchema(x: unknown): x is t.StandardSchemaV1 {
  return (
    !!x &&
    typeof x === 'object' &&
    '~standard' in (x as any) &&
    typeof (x as any)['~standard']?.validate === 'function'
  );
}

/**
 * Ensure a schema is wrapped as a Standard Schema v1 adapter.
 * (Idempotent — returns the same object if already wrapped.)
 */
export function asStandardSchema(schema: unknown, vendor = D.StdSchema.vendor): t.StandardSchemaV1 {
  return isStandardSchema(schema)
    ? (schema as t.StandardSchemaV1)
    : toStandardSchema(schema as t.TSchema, vendor);
}
