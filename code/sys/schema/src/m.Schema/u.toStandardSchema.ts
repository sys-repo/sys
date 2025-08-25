import { type t, Value } from './common.ts';
import type { StandardSchemaIssue, StandardSchemaV1 } from './t.standard-schema.ts';

/**
 * Wrap a JSON Schema (TypeBox) with the Standard Schema v1 interface.
 * - Pure adapter (no mutation of the original schema).
 * - Strict semantics: uses Value.Check / Value.Errors (no coercion).
 * - `vendor` defaults to "sys".
 */
export function toStandardSchema<S extends t.TSchema, TOut = t.Static<S>>(
  schema: S,
  vendor = 'sys',
): StandardSchemaV1<unknown, TOut> {
  return {
    '~standard': {
      version: '1.0.0',
      vendor,
      validate(value: unknown) {
        if (Value.Check(schema, value)) {
          return { ok: true as const, value: value as TOut };
        }

        const issues = Array.from(Value.Errors(schema, value), (e): StandardSchemaIssue => {
          return {
            path: decodeJsonPointer(e.path),
            message: e.message,
          } as const;
        }) as readonly StandardSchemaIssue[];

        return { ok: false as const, issues };
      },
    },
  } satisfies StandardSchemaV1<unknown, TOut>;
}

/**
 * Decode an RFC6901 JSON Pointer (e.g. "/a/0/b") into an object path.
 * - Unescapes "~1" -> "/" and "~0" -> "~".
 * - Converts digit-only tokens to numbers (conservative array index hint).
 */
function decodeJsonPointer(ptr: string): readonly (string | number)[] {
  if (!ptr || ptr === '') return [] as const;
  // Pointers should start with "/", but tolerate others.
  const raw = ptr.startsWith('/') ? ptr.slice(1) : ptr;
  if (!raw) return [] as const;

  const tokens = raw.split('/').map(unescapeToken).map(coerceMaybeNumber);
  return tokens as readonly (string | number)[];
}

function unescapeToken(token: string): string {
  // RFC6901: "~1" => "/", "~0" => "~"
  return token.replace(/~1/g, '/').replace(/~0/g, '~');
}

function coerceMaybeNumber(s: string): string | number {
  // Treat purely digit tokens as numbers (common for array indices).
  // Do NOT coerce negatives or decimals; keep them as strings.
  return /^[0-9]+$/.test(s) ? Number(s) : s;
}
