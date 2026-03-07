import type { t } from './common.ts';

/** Type re-exports */
export type * from './t.namespace.ts';
export type * from './t.lib.ts';

/**
 * Base slug-trait shape.
 */
export type SlugTrait = {
  readonly of?: string;
  readonly as?: string;
  readonly [key: string]: unknown;
};

/**
 * Trait-based gating for operations that derive data from a node using a trait
 * contract `{ of, as }`.
 *
 * Default behavior is strict: missing/invalid traits fail.
 * To proceed without a valid trait, callers must explicitly supply `forcedAs`.
 */
export type SlugTraitGateOptions = {
  /** Trait `of` value to match. */
  readonly of: string;

  /**
   * Missing-trait policy.
   * - "require" (default): fail if the trait is missing or invalid.
   * - "force": continue only when `forcedAs` is provided.
   */
  readonly mode?: 'require' | 'force';

  /**
   * Explicit `as` key to use when `mode` is "force" and the trait's `as`
   * value is missing or invalid.
   */
  readonly forcedAs?: string;
};
