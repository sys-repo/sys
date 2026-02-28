import type { t } from './common.ts';

/**
 * Monaco-backed notes UI for lightweight local-first editing.
 */
export declare namespace MonacoNotes {
  export type Lib = { readonly UI: t.FC<Props> };
  export type Props = {
    debug?: boolean;
    theme?: t.CommonTheme;
    wordWrap?: boolean;
    style?: t.CssInput;
  };
}
