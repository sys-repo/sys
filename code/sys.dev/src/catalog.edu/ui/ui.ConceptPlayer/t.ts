import type { t } from './common.ts';

/**
 * Component:
 */
export type ConceptPlayerProps = Pick<t.CrdtView.LayoutProps, 'crdt' | 'header' | 'sidebar'> & {
  signals?: t.ConceptPlayerSignals;
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
export type ConceptPlayerSignals = t.CrdtView.LayoutSignals & {};
