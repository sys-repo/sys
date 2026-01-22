import type { t } from '../common.ts';

/** Type exports */
export type * from './t.seq.ts';
export type * from './t.normalize.ts';

/**
 * Schema-focused helpers for authoring-time slug sequences.
 */
export type SlugSequenceSchemaLib = {
  readonly Is: SlugSequenceIsLib;
  readonly List: t.ArrSpec;

  /** Structural validation of an authoring-time sequence. */
  validate(input: unknown): t.ValidateResult<t.SequenceItem[]>;

  /** Checks invariants that sit on top of the raw JSON schema */
  checkInvariants(sequence: t.SequenceItem[]): string | undefined;
};

/**
 * Type guards.
 */
export type SlugSequenceIsLib = {
  /**
   * Cheap structural guard that ensures the item
   * looks like one of the known sequence shapes
   * (but not actually schema validated).
   */
  itemLike(value: unknown): value is t.SequenceItem;
};
