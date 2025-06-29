import type { t } from './common.ts';

/**
 * <Component>:
 */
export type TextPanelProps = {
  label?: string;
  doc?: t.CrdtRef;
  path?: t.ObjectPath;

  // Debug:
  debug?: boolean;
  warnings?: boolean;

  // Appearance:
  theme?: t.CommonTheme;
  style?: t.CssInput;
  labelOpacity?: t.Percent;
  rowGap?: t.Percent;
};
