import type { CSSProperties } from 'react';
import type { t } from './common.ts';

export type CssObject = CSSProperties;

/**
 * CSS styling tools.
 */
export type StyleLib = {
  readonly Color: t.ColorLib;
  readonly Edges: t.CssEdgesLib;

  readonly transform: t.CssTransform;
  readonly css: t.CssTransformToStyle;

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
 * object that can be applied to a JSX element.
 *
 * NB: This is the raw transform containing the style along with cache metadata.
 */
export type CssTransform = (...input: t.CssInput[]) => t.CssTransformed;

/**
 * Function that transforms 1..n CSS inputs into a style
 * object that can be applied to a JSX element.
 *
 * NB: This is the raw transform containing the style along with cache metadata.
 */
export type CssTransformToStyle = (...input: t.CssInput[]) => t.CssObject;

/**
 * A transformed CSS properties object.
 */
export type CssTransformed = {
  /** The hash of the style (used for caching). */
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
