import type { t } from './common.ts';

/**
 * Adapts Markdown input into prose semantics without imposing layout or typography.
 */
export namespace ProseMarkdown {
  export type Lib = { readonly UI: t.FC<Props> };
  export type Props = {
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };
}
