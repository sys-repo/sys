import type { t } from './common.ts';

type N = number | string | null | undefined;

/**
 * Types a default value for an edge can be.
 */
export type CssEdgeDefault = null | string | number;

/**
 * Callback that mutates the results of the toEdges function.
 */
export type CssEdgeMutater = (e: CssEdgeMutaterArgs) => void;

/**
 * Arguments for the CssEdgeMutator.
 */
export type CssEdgeMutaterArgs = {
  readonly current: { readonly value?: N; readonly edge: keyof t.CssEdges };
  changeValue(next: N): void;
  changeField(next: keyof t.CSSObject | null): void;
};

/**
 * Edge value formatter.
 */
export type CssEdgesLib = {
  /** Convert sloppy inputs into a clean edges array. */
  toArray(input: t.CssEdgesInput, defaultValue?: CssEdgeDefault): t.CssEdgesArray;

  /** Convert sloppy inputs into a clean edges array on the X-dimension (horizontal). */
  toArrayX(input: t.CssEdgesXYInput, defaultValue?: CssEdgeDefault): t.CssEdgesArray;

  /** Convert sloppy inputs into a clean edges array on the Y-dimension (vertical). */
  toArrayY(input: t.CssEdgesXYInput, defaultValue?: CssEdgeDefault): t.CssEdgesArray;

  /**
   * Takes an array of input CSS values and converts them to
   * [top, right, bottom, left] values.
   *
   * Input:
   *  - single value (eg. 0 or '5em')
   *  - 4-part array (eg. [10, null, 0, 5])
   *  - Y/X array    (eg. [20, 5])
   */
  toEdges: t.CssToEdges<t.CssEdges>;

  /** Converts input to CSS margin edges. */
  toMargins: t.CssToEdges<t.CssMarginEdges>;

  /** Converts input to CSS padding edges. */
  toPadding: t.CssToEdges<t.CssPaddingEdges>;
};

/**
 * Transformer that converts a set of edge value inpurts to a CssEdges object.
 */
export type CssToEdges<T> = (
  input?: t.CssEdgesInput | [],
  options?: { defaultValue?: t.CssEdgesInput },
) => Partial<T>;
