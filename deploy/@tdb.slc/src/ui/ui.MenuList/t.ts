import type { t } from './common.ts';

/**
 * <Component>:
 */
export type MenuListProps = {
  debug?: boolean;
  items?: (MenuListItem | string | undefined)[];
  selected?: t.Index | t.Index[];
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onSelect?: (e: { index: t.Index; item: t.MenuListItem }) => void;
};

/**
 * Definition for a single item in a list.
 */
export type MenuListItem = {
  id?: string;
  label?: string;
};
