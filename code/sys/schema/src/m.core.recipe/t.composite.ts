import { type t } from './common.ts';

/**
 * Composites
 */

/** Array of items with optional length bounds. */
export type ArrSpec = {
  readonly kind: 'array';
  readonly items: t.SpecVariant;
  readonly minItems?: number;
  readonly maxItems?: number;
  readonly description?: string;
  readonly title?: string;
};

/** Object with fixed properties and optional additionalProperties. */
export type ObjSpec = {
  readonly kind: 'object';
  readonly props: { readonly [k: string]: t.SpecVariant };
  readonly additionalProperties?: boolean;
  readonly description?: string;
  readonly title?: string;
};

/** Union of multiple schema variants. */
export type UnionSpec = {
  readonly kind: 'union';
  readonly variants: readonly t.SpecVariant[];
  readonly description?: string;
  readonly title?: string;
};

/** Optional wrapper around another schema. */
export type OptSpec = {
  readonly kind: 'optional';
  readonly of: t.SpecVariant;
  readonly description?: string;
  readonly title?: string;
};

/** Record (map) with pattern-constrained keys and a value schema. */
export type RecordSpec = {
  readonly kind: 'record';
  readonly keyPattern?: string;
  readonly value: t.SpecVariant;
  readonly description?: string;
  readonly title?: string;
};
