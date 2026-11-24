import type { t } from './common.ts';

/**
 * A compact editorial aside.
 */
export declare namespace Admonition {
  export type Lib = { readonly UI: t.FC<Props> };

  /** Editorial intent of the aside. */
  export type Kind = 'note' | 'tip' | 'important' | 'caution' | 'warning';

  export type Props = {
    /**
     * Markdown source. An opening `#` is an optional title for the aside.
     * Use inline links (`[label](url)`); reference-style link definitions are not supported.
     */
    markdown: string;
    /** Editorial kind. Defaults to `'tip'`. */
    kind?: Kind;
    /** Allow text selection in the Markdown body. Defaults to `true`. */
    selectable?: boolean;
    /** Corner radius in pixels. Defaults to 4; use 0 for square corners. */
    radius?: t.Pixels;
    /** DOM ID on the note, for caller-owned references such as `aria-describedby`. */
    id?: string;
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.Style.Input;
  };
}
