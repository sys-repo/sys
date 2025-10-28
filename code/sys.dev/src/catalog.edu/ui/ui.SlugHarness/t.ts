import type { t } from './common.ts';

/**
 * Component:
 */
export type SlugHarnessProps = Pick<t.CrdtView.LayoutProps, 'crdt' | 'header' | 'sidebar'> & {
  signals?: t.SlugHarnessSignals;
  docPath?: t.ObjectPath;
  slugPath?: t.ObjectPath;
  //
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * State wrapped in signals.
 */
export type SlugHarnessSignals = t.CrdtView.LayoutSignals & {};
