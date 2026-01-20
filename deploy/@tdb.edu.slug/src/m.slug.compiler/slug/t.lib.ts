import type { t } from './common.ts';

/**
 * Tools for working with slugs.
 */
export type SlugLib = {
  readonly parser: t.MakeParser;
  readonly Schema: t.SlugSchemaLib;
  readonly Tree: t.SlugTreeLib;
  readonly Trait: {
    readonly MediaComposition: t.MediaCompositionLib;
    readonly Helpers: t.SlugTraitsSchemaLib;
  };
};
