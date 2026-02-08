import type { t } from './common.ts';

/**
 * A pure, typographic "prose" surface for rendering long-form authored text.
 */
export namespace Prose {
  export type Lib = {
    readonly UI: t.FC<ManuscriptProps>;
    readonly Manuscript: t.FC<ManuscriptProps>; // ← alias to default
  };
  export type ManuscriptProps = {
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };
}
