import type { t } from '../common.ts';

type O = Record<string, unknown>;

/**
 * Component: CRDT <ObjectView>.
 */
export type CrdtObjectViewProps = Pick<t.ObjectViewProps, 'expand' | 'name'> & {
  /** The CRDT document reference being examined. */
  doc?: t.Crdt.Ref;
  /** Configurations of lens view into the CRDT document.  */
  lenses?: CrdtPartialLenses;
  /** Insert additional sundry props before the doc/lenses data. */
  prepend?: O;
  /** Insert additional sundry props after the doc/lenses data. */
  append?: O;
  //
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * A lens into the document to display.
 */
export type CrdtLens = {
  /** The display name of the lens. */
  readonly name: string;
  /** Path within the CRDT document to the relevant data. */
  readonly path: t.ObjectPath;
};
/** Partial lens variants: */
export type CrdtPartialLens = Partial<t.CrdtLens>;
export type CrdtPartialLensInput = CrdtPartialLens | (() => CrdtPartialLens);
export type CrdtPartialLenses = readonly CrdtPartialLensInput[];
