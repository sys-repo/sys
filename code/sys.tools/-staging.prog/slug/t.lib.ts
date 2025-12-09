import type { t } from './common.ts';

/**
 * Tools for working with slugs.
 */
export type SlugLib = {
  readonly Sequence: t.SequenceLib;
  readonly parser: t.MakeParserFn;
};
