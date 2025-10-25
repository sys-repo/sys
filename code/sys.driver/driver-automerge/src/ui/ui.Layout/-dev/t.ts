import { type t } from '../common.ts';

export type SignalsObjectViewProps = Pick<t.ObjectViewProps, 'expand' | 'name'> & {
  signals?: t.LayoutSignals;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
