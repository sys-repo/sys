import type { StandardSchemaV1 } from '@standard-schema/spec';

/**
 * Official Standard Schema v1 contract.
 * ref: https://standardschema.dev
 */
export type { StandardSchemaV1 } from '@standard-schema/spec';

/** A single validation issue reported by a Standard Schema validator. */
export type StandardSchemaIssue = StandardSchemaV1.Issue;

/** A result from a Standard Schema `validate` method call. */
export type StandardSchemaV1Result<Output = unknown> = StandardSchemaV1.Result<Output>;
