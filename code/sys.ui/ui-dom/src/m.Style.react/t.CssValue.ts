import type { CSSObject } from '@emotion/react';
import type { t } from './common.ts';

export type { CSSObject };
export type CssInput = t.CssValue | undefined | null | false | never | CssInput[];

/**
 * Standard CSS properties with CSS-template extensions.
 */
export type CssValue = t.CSSObject & t.CssTemplates;

/**
 * CSS Templates.
 *
 * These are CSS template-names disambiguated from other
 * css properties by being capitalied.
 *
 * A template is used to transform common CSS operations into
 * their proper CSS equivalent.
 */
export type CssTemplates = {
  Absolute?: CssEdgesInput;
  Margin?: CssEdgesInput;
  MarginX?: CssEdgesXYInput;
  MarginY?: CssEdgesXYInput;
  Padding?: CssEdgesInput;
  PaddingX?: CssEdgesXYInput;
  PaddingY?: CssEdgesXYInput;
};

/**
 * Edges
 */
type N = string | number | null | undefined;

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
