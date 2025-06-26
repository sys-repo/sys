import type { t } from './common.ts';

/**
 * <Component>:
 */
export type TextPanelProps = {
  label?: string;
  doc?: t.CrdtRef;
  path?: t.ObjectPath;

  // Appearance:
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  labelOpacity?: t.Percent;
};
