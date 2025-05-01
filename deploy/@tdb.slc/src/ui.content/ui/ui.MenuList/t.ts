import type { t } from './common.ts';

/**
 * <Component>:
 */
export type MenuListProps = {
  debug?: boolean;
  items?: t.VideoMediaContent[];
  selected?: t.Index | t.Index[];
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onSelect?: (e: { item: t.VideoMediaContent; index: t.Index }) => void;
};
