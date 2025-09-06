/**
 * A single validation error reported by a Standard Schema validator.
 * - `path`:    object path to the failing value.
 * - `message`: human-readable description of the failure.
 */
export type StandardSchemaIssue = Readonly<{
  path: readonly (string | number)[];
  message: string;
}>;

/**
 * Wrap a JSON Schema (e.g. TypeBox) with a Standard Schema v1 adapter.
 * ref: https://standardschema.dev
 *
 * - Pure adapter:     does not mutate the original schema.
 * - Strict semantics: mirrors Value.Check/Value.Errors (no coercion).
 * - `vendor` defaults to "sys" (override if needed).
 */
export type StandardSchemaV1<Input = unknown, Output = Input> = Readonly<{
  '~standard': Readonly<{
    version: '1.0.0';
    vendor: string;
    types?: unknown;
    validate(value: Input): StandardSchemaV1Result<Input, Output>;
  }>;
}>;

/** A result from a standard-schema `validate` method call. */
export type StandardSchemaV1Result<Input = unknown, Output = Input> =
  | Readonly<{ ok: true; value: Output }>
  | Readonly<{ ok: false; issues: readonly StandardSchemaIssue[] }>;
