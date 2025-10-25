import { type t } from '../common.ts';

type PartialLens = Partial<t.SignalsObjectViewLens>;
type PartialLensItem = PartialLens | (() => PartialLens);
type PartialLensesInput = readonly PartialLensItem[];

export type SignalsObjectViewProps = Pick<t.ObjectViewProps, 'expand' | 'name'> & {
  signals?: t.LayoutSignals;
  lenses?: PartialLensesInput;
  //
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * A lends into the document to display.
 */
export type SignalsObjectViewLens = {
  path: t.ObjectPath;
  field: string;
};
