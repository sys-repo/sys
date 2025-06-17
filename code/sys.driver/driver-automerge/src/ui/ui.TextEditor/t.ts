import type { t } from './common.ts';

/**
 * <Component>:
 */
export type TextEditorProps = {
  doc?: t.CrdtRef<any>;

  /**
   * Flags:
   */
  /** Supress editing of the document. */
  readOnly?: boolean;
  /** Auto-focus the input on mount (pass incrementing number to re-apply focus over time). */
  autoFocus?: boolean | number;
  /** Scroll enabled.  */
  scroll?: boolean;
  /** Single or multi-line text. */
  singleLine?: boolean;

  /**
   * Appearance:
   */
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
