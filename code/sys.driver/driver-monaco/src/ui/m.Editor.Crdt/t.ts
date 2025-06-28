import type { t } from './common.ts';

/**
 * <Component>:
 */
export type CodeEditorProps = {
  path?: t.ObjectPath;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
