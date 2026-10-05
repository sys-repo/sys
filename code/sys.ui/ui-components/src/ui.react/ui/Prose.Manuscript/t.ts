import type { t } from './common.ts';

/**
 * A pure, typographic "prose" surface for rendering long-form authored text.
 */
export namespace ProseManuscript {
  export type Lib = { readonly UI: t.FC<Props> };

  export type Props = {
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };
}
