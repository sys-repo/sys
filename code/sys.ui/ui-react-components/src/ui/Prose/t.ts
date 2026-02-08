import type { t } from './common.ts';

/**
 * A pure typographic surface for rendering long-form authored text.
 */
export namespace Prose {
  export type Lib = {
    readonly Manuscript: t.ProseManuscript.Lib;
  };
}
