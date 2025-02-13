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
  changeField(next: keyof t.CssProps | null): void;
};

/**
 * Edge value formatting tools.
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

/**
 * Edges
 */

export type CssMarginInput = CssEdgesInput;
export type CssPaddingInput = CssEdgesInput;

/**
 * Value representing an edge (eg. "left" or "right").
 */
export type CssEdgeInput = N;

/**
 * Loose input for edges around a 4-sided entity.
 */
export type CssEdgesInput = N | [N] | [N, N] | [N, N, N, N];

/**
 * Loose inputs for a value representing a single-dimension (X/Y)
 */
export type CssEdgesXYInput = N | [N] | [N, N];

/**
 * Edges for a 4-sided entity.
 */
export type CssEdges = {
  top: string | number;
  right: string | number;
  bottom: string | number;
  left: string | number;
};

/**
 * Array of edge values: "top", "right", "bottom", "left"
 */
export type CssEdgesArray = [N, N, N, N];

/**
 * An array of edges representing a margin.
 */
export type CssMarginArray = CssEdgesArray;

/**
 * An array of edges representing a padding.
 */
export type CssPaddingArray = CssEdgesArray;

/**
 * CSS margin edges.
 */
export type CssMarginEdges = {
  marginTop: string | number;
  marginRight: string | number;
  marginBottom: string | number;
  marginLeft: string | number;
};

/**
 * CSS padding edges.
 */
export type CssPaddingEdges = {
  paddingTop: string | number;
  paddingRight: string | number;
  paddingBottom: string | number;
  paddingLeft: string | number;
};
