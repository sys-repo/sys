import type { t } from './common.ts';

/**
 * A pure typographic surface for rendering long-form authored text.
 */
export namespace Prose {
  export type Lib = {
    readonly Manuscript: t.ProseManuscript.Lib;
  };

  /** Define a CSS rule within a curried component-attr class scope. */
  export type ScopedCssRule = (selector: string, css: t.CssValue) => void;
}
