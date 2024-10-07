import type { CSSObject } from '@emotion/react';
import type { t } from './common.ts';

type N = string | number | null | undefined;
export type CssEdgeInput = N;
export type CssEdgesInput = N | [N] | [N, N] | [N, N, N, N];

export type CssProperties = CSSObject;
export type CssInput = t.CssValue | undefined | null | false | never | CssInput[];

/**
 * Standard CSS properties with CSS-template extensions.
 */
export type CssValue = t.CssProperties & t.CssTemplates;

/**
 * CSS Value
 */
export type CssTemplates = {
  Absolute?: CssEdgesInput;
};
