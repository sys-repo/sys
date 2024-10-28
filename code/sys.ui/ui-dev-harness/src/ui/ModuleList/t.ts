import type { t } from './common.ts';

/**
 * Default values.
 */
export type ModuleListDefaults = {
  name: string;
  displayName: string;
  qs: t.DefaultsQueryString;
  list: { minWidth: number };
  useAnchorLinks: boolean;
  showParamDev: boolean;
};

/**
 * <Component>
 */
export type ModuleListComponent = React.FC<t.ModuleListProps> & ModuleListComponentFields;
export type ModuleListComponentFields = { DEFAULTS: t.ModuleListDefaults };

/**
 * Component properties
 */
export type ModuleListProps<T = unknown> = {
  title?: string;
  version?: string;
  imports?: t.ModuleImports<T>;
  selectedIndex?: number;
  href?: string;
  hrDepth?: number;
  badge?: t.ImageBadge;
  showParamDev?: boolean;
  allowRubberband?: boolean;
  useAnchorLinks?: boolean;
  enabled?: boolean;
  focused?: boolean;
  listMinWidth?: number;
  theme?: t.CommonTheme;
  style?: t.CssValue;
  scroll?: boolean;
  scrollTo$?: t.Observable<t.ModuleListScrollTarget>;
  onItemVisibility?: t.ModuleListItemVisibilityHandler;
  onItemClick?: t.ModuleListItemHandler;
  onItemSelect?: t.ModuleListItemHandler;
};

/**
 * Passed through an observer to direct the component to scroll to a specific location.
 */
export type ModuleListScrollTarget = { index: number };

/**
 * Fired when a list-item is scrolled into or out-of view.
 */
export type ModuleListItemVisibilityHandler = (e: ModuleListItemVisibilityHandlerArgs) => void;
export type ModuleListItemVisibilityHandlerArgs = { children: ModuleListItemVisibility[] };
export type ModuleListItemVisibility = {
  index: number;
  isVisible: boolean;
  threshold: t.Percent | [t.Percent, t.Percent, t.Percent, t.Percent];
};

/**
 * Fired when a list-item changes it's ready state.
 */
export type ModuleListItemReadyHandler = (e: ModuleListItemReadyHandlerArgs) => void;
export type ModuleListItemReadyHandlerArgs = {
  index: number;
  lifecycle: 'ready' | 'disposed';
  el?: HTMLLIElement;
};

/**
 * Fired when a list-item is clicked.
 * NB: existence of this event-handler prop supresses the default <a> link click behavior.
 */
export type ModuleListItemHandler = (e: ModuleListItemHandlerArgs) => void;
export type ModuleListItemHandlerArgs = {
  index: number;
  uri?: string;
};
