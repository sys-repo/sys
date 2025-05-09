import type { t } from './common.ts';

/**
 * <Component>:
 */
export type MonacoEditorProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
