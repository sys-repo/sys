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
  /**
   * Convert sloppy inputs into a clean edges array.
   */
  toArray(input: t.CssEdgesInput, defaultValue?: CssEdgeDefault): t.CssEdgesArray;
  /**
   * Convert sloppy inputs into a clean edges array on the X-dimension (horizontal).
   */
  toArrayX(input: t.CssEdgesXYInput, defaultValue?: CssEdgeDefault): t.CssEdgesArray;
  /**
   * Convert sloppy inputs into a clean edges array on the Y-dimension (vertical).
   */
  toArrayY(input: t.CssEdgesXYInput, defaultValue?: CssEdgeDefault): t.CssEdgesArray;
};
