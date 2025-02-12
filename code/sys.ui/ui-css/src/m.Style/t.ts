import type * as CSS from 'csstype';
import type { t } from './common.ts';

export type CSSProperties = CSS.PropertiesFallback<number | string>;
export type CssObject = CSSProperties;

/**
 * CSS styling tools.
 */
export type StyleLib = {
  readonly Color: t.ColorLib;
  readonly Edges: t.CssEdgesLib;

  readonly css: t.CssTransformer;
  readonly toMargins: t.CssEdgesLib['toMargins'];
  readonly toPadding: t.CssEdgesLib['toPadding'];
  readonly toShadow: CssToShadow;
};

/**
 * Standard CSS properties with CSS-template extensions.
 */
export type CssValue = t.CssObject & t.CssTemplates;
export type CssInput = t.CssValue | undefined | null | false | never | CssTransformed | CssInput[];

/**
 * Function that transforms 1..n CSS inputs into a style
 * object that can be applied to a React element.
 */
export type CssTransformer = (...input: t.CssInput[]) => t.CssTransformed;

/**
 * A transformed CSS properties object.
 */
export type CssTransformed = {
  /** The hash of the style. */
  readonly hx: number;
  /** Style properties. */
  readonly style: t.CssObject;
};

/**
 * Shadow
 */
export type CssToShadow = (input?: CssShadow) => string | undefined;
export type CssShadow = {
  color: number | string;
  blur: number;
  x?: number;
  y?: number;
  inner?: boolean;
};
