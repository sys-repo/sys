import type { t } from './common.ts';

/**
 * Tools for working with slugs.
 */
export type SlugLib = {
  readonly parser: t.MakeParser;
  readonly Trait: {
    readonly MediaComposition: t.MediaCompositionLib;
  };
};
