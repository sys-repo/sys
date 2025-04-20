import type { CSSProperties } from 'react';
import type { t } from './common.ts';
export type * from './t.transform.ts';

export type CssNumberOrStringInput = number | string | null | undefined;
type N = CssNumberOrStringInput;

/**
 * CSS-Properties that accept string AND (inferable "unit" numbers) as values.
 * For example:
 *
 *  - { fontSize: 32 }
 *  - { fontSize: '32px' }
 */
export type CssProps = CSSProperties;

/**
 * Standard CSS properties with CSS-template extensions.
 */
export type CssValue = t.CssProps & t.CssPseudo & t.CssTemplates;
export type CssInput =
  | t.CssValue
  | undefined
  | null
  | false
  | never
  | t.CssTransformed
  | CssInput[];

/**
 * A CSS class-name.
 * (no period, eg. "foo" not ".foo")
 */
export type CssClassname = string;
export type CssClassPrefix = string;

/** Options passed to `Style.transformer` factory function. */
export type StyleTransformerOptions = { sheet?: t.CssDomStylesheet };

/**
 * CSS styling tools.
 */
export type StyleLib = NamespaceLibs & {
  /** Perform a transformation on a loose set of CSS inputs. */
  readonly css: t.CssTransform;

  /** Factory to produce `transform` function scoped to the given prefix. */
  transformer(options?: t.StyleTransformerOptions): t.CssTransform;

  /** Transform margin spacing. */
  readonly toMargins: t.CssEdgesLib['toMargins'];
  /** Transform padding spacing. */
  readonly toPadding: t.CssEdgesLib['toPadding'];
  /** Transform shadding settings. */
  readonly toShadow: CssToShadow;

  /** Convert a {style} props object to a CSS string. */
  toString(style?: t.CssValue): string;

  /** Determine if the CSS value input amounts to 0. */
  isZero(value?: N): boolean;
};

type NamespaceLibs = {
  /** Tools for working with colors. */
  readonly Color: t.ColorLib;

  /** Tools for working with edges. */
  readonly Edges: t.CssEdgesLib;

  /** Tools for working with edges. */
  readonly Tmpl: t.CssTmplLib;

  /** Tools for programatically managing CSS stylesheets within the browser DOM. */
  readonly Dom: t.CssDomLib;
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

/**
 * CSS psuedo-classes.
 */
export type CssPseudo = {
  ':hover'?: t.CssValue;
  // ':active'?: t.CssValue;
  // ':focus'?: t.CssValue;
  // ':visited'?: t.CssValue;
};
