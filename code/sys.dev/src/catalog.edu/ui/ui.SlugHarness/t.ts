import type { t } from './common.ts';

export type * from './t.reg.ts';
export type * from './t.render.ts';

/**
 * Component: Harness
 */
export type SlugHarnessProps = Pick<t.CrdtView.LayoutProps, 'crdt' | 'header' | 'sidebar'> & {
  registry?: t.SlugViewRegistryReadonly;
  signals?: t.SlugHarnessSignals;
  docPath?: t.ObjectPath;
  slugPath?: t.ObjectPath;
  main?: t.SlugViewId;
  //
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * State wrapped in signals.
 */
export type SlugHarnessSignals = t.CrdtView.LayoutSignals & {};

/**
 * Component: Single Slug
 */
export type SlugViewProps = {
  view?: t.SlugViewId;
  registry?: t.SlugViewRegistryReadonly;
  doc?: t.Crdt.Ref;
  docPath?: t.ObjectPath;
  slugPath?: t.ObjectPath;
  //
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
