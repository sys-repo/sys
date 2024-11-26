export type * from '../../common/t.ts';
import type { t } from './common.ts';

/**
 * Types
 */
export type InfoField = 'Module' | 'Module.Verify' | 'Component';
export type InfoData = {
  component?: { label?: string; name?: string };
};

export type InfoProps = {
  title?: t.PropListProps['title'];
  width?: t.PropListProps['width'];
  fields?: (InfoField | undefined)[];
  data?: InfoData;
  margin?: t.CssEdgesInput;
  theme?: t.CommonTheme;
  style?: t.CssValue;
};
