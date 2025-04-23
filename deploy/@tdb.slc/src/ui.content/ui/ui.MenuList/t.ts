import type { t } from './common.ts';

/**
 * <Component>:
 */
export type MenuListProps = {
  debug?: boolean;
  items?: t.VideoMediaContent[];
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onSelect?: (e: { item: t.VideoMediaContent }) => void;
};
