import type { t } from './common.ts';

/**
 * Tools for working with slugs.
 */
export type SlugLib = {
  readonly parser: t.MakeParser;
  readonly Trait: {
    readonly Helpers: t.SlugTraitLib;
    readonly MediaComposition: t.MediaCompositionLib;
  };
  readonly Tree: t.SlugTreeLib;
};
