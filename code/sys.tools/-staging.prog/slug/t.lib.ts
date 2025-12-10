import type { t } from './common.ts';

/**
 * Tools for working with slugs.
 */
export type SlugLib = {
  readonly MediaComposition: t.MediaCompositionLib;
  readonly Sequence: t.SlugSequenceLib;
  readonly parser: t.MakeParserFn;
  readonly toPlayback: t.ToSlugPlaybackSpec;
};
