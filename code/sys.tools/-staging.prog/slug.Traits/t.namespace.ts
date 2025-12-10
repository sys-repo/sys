import type { t } from './common.ts';

/**
 * Trait family for slugs.
 */
export namespace SlugTraits {
  export type Lib = t.SlugTraitLib;

  /** Unconstrained trait: matches any `traits:` entry. */
  export type Any = t.SlugTrait;

  /** Media-composition related traits. */
  export namespace MediaComposition {
    /**
     * `of: media-composition`, `as: sequence`.
     *
     * Optional `path` allows future configuration of where
     * the authoring sequence lives inside the slug data.
     */
    export type Sequence = t.SlugTrait & {
      readonly of: 'media-composition';
      readonly as: 'sequence';
      readonly path?: string;
    };
  }

  // Future:
  // export namespace SlugList { ... }
}
