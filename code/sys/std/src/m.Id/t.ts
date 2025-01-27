import type { t } from '../common.ts';

/**
 * Library: tools for generating and working with inique identifiers.
 */
export type IdLib = {
  /** Type guards (boolean evaluators). */
  readonly Is: t.IdIsLib;

  /** Length constants */
  readonly Length: { readonly cuid: number; readonly slug: number };

  /**
   * Generated a new CUID.
   * A secure, collision-resistant ids optimized for horizontal scaling and performance.
   */
  readonly cuid: t.IdGenerator;

  /** Generate a slug (aka. a short CUID). */
  readonly slug: t.IdGenerator;

  /**
   * Initialize a new `IdGenerator` instance that can be used
   * to configure ID factories at different string lengths.
   */
  init(length: number): t.IdGeneratorInstance;
};

/** Generator function that produces a unique ID string. */
export type IdGenerator = () => t.StringId;

/** Instance of an `IdGenerator` */
export type IdGeneratorInstance = {
  /** The string length of the ID's that will be generated. */
  readonly length: number;

  /** Generator function */
  generate: t.IdGenerator;

  /** Boolean evaluator that determine if the given value is an ID generated by this instance. */
  is(input: any): boolean;
};

/**
 * Type guards (boolean evaluators).
 */
export type IdIsLib = {
  /** Determine if the value is a valid CUID. */
  cuid(input: any): boolean;

  /** Determine if the value is a valid "slug" (aka. short CUID). */
  slug(input: any): boolean;
};
