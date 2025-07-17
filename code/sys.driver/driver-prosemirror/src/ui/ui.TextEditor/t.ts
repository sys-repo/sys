import type { t } from './common.ts';

/**
 * <Component>:
 */
export type TextEditorProps = {
  /** The CRDT to record onto. */
  doc?: t.Crdt.Ref<any>;
  /** The path within the CRDT to target. */
  path?: t.ObjectPath;

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
