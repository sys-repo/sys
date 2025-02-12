import type { CSSProperties } from 'react';
import type { t } from './common.ts';

/**
 * CSS-Properties that accept string AND (inferable "unit" numbers) as values.
 * For example:
 *
 *  - { fontSize: 32 }
 *  - { fontSize: '32px' }
 */
export type CssProps = CSSProperties;

/**
 * CSS styling tools.
 */
export type StyleLib = {
  /** Tools for working with colors. */
  readonly Color: t.ColorLib;
  /** Tools for working with edges. */
  readonly Edges: t.CssEdgesLib;

  /** Perform a cacheable transformation on a loose set of CSS inputs. */
  readonly transform: t.CssTransform;

  /** Transform a lose set of CSS inputs into a CSS class-name. */
  readonly css: t.CssTransformToStyle;

  /** Transform margin spacing. */
  readonly toMargins: t.CssEdgesLib['toMargins'];
  /** Transform padding spacing. */
  readonly toPadding: t.CssEdgesLib['toPadding'];
  /** Transform shadding settings. */
  readonly toShadow: CssToShadow;
};

/**
 * Standard CSS properties with CSS-template extensions.
 */
export type CssValue = t.CssProps & t.CssTemplates;
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
export type CssTransformToStyle = (...input: t.CssInput[]) => t.CssProps;

/**
 * A transformed CSS properties object.
 */
export type CssTransformed = {
  /** The hash of the style (used for caching). */
  readonly hx: number;
  /** Style properties. */
  readonly style: t.CssProps;
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
