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
  onSelect?: t.MenuListItemHandler;
};

/**
 * Definition for a single item in a list.
 */
export type MenuListItem = {
  id?: string;
  label?: string | (() => string);
};

/**
 * Event: MenuItem
 */
export type MenuListItemHandler = (e: MenuListItemHandlerArgs) => void;
export type MenuListItemHandlerArgs = {
  index: t.Index;
  label: string;
  id?: string;
};
