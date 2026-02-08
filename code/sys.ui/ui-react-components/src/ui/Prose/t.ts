import type { t } from './common.ts';

/**
 * A pure, typographic "prose" surface for rendering long-form authored text.
 */
export namespace Prose {
  export type Lib = {
    readonly Manuscript: { readonly UI: t.FC<Manuscript.Props> };
  };

  export namespace Manuscript {
    export type Props = {
      debug?: boolean;
      theme?: t.CommonTheme;
      style?: t.CssInput;
    };
  }
}
