import type { t } from './common.ts';

/**
 * <Component>:
 */
export type TextEditorProps = {
  debug?: boolean;
  doc?: t.CrdtRef<any>;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
