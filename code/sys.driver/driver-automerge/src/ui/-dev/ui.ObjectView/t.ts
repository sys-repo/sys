import type { t } from '../common.ts';

/**
 * Component: CRDT <ObjectView>.
 */
export type CrdtObjectViewProps = Pick<t.ObjectViewProps, 'expand' | 'name'> & {
  doc?: t.Crdt.Ref;
  lenses?: CrdtPartialLenses;
  //
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * A lens into the document to display.
 */
export type CrdtLens = {
  readonly field: string;
  readonly path: t.ObjectPath;
};
/** Partial lens variants: */
export type CrdtPartialLens = Partial<t.CrdtLens>;
export type CrdtPartialLensInput = CrdtPartialLens | (() => CrdtPartialLens);
export type CrdtPartialLenses = readonly CrdtPartialLensInput[];
