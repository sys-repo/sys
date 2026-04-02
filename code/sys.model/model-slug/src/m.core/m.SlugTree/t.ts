import { type t } from './common.ts';

/**
 * @module
 * Pure `SlugTree` operations.
 */
export declare namespace SlugTree {
  export type Lib = {
    readonly reindex: Reindex;
    readonly toYaml: ToYaml;
  };

  export type Reindex = (args: {
    prev: t.SlugTreeItems;
    next: t.SlugTreeItems;
    opts?: ReindexOpts;
  }) => t.SlugTreeItems;

  export type ReindexOpts = {
    key?: 'auto' | 'ref' | 'slug';
  };

  export type ToYaml = (doc: t.SlugTreeDoc) => string;
}
