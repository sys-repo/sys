import type { t } from '../common.ts';

export type * from './t.seq.ts';

/**
 * Slug sequence tools.
 */
export type SequenceLib = {
  readonly Is: SequenceIsLib;
  validate(input: unknown): t.ValidateResult<t.Sequence>;
};

/**
 * Type guards.
 */
export type SequenceIsLib = {
  /**
   * Cheap structural guard that ensures the item
   * looks like one of the known sequence shapes (not actually validated).
   */
  itemLike(value: unknown): value is t.SequenceItem;
};
