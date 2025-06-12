import type { t } from './common.ts';

/**
 * <Component>:
 */
export type TextEditorProps = {
  doc?: t.CrdtRef<any>;
  autoFocus?: boolean;
  readOnly?: boolean;

  // Appearance:
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
