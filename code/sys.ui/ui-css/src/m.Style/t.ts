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
 * A CSS class-name.
 * (no period, eg "foo" not ".foo")
 */
export type CssClassname = string;
export type CssClassPrefix = string;

/** Options passed to `Style.transformer` factory function. */
export type StyleTransformerOptions = { classPrefix?: string };

/**
 * CSS styling tools.
 */
export type StyleLib = NamespaceLibs & {
  /** Perform a transformation on a loose set of CSS inputs. */
  readonly css: t.CssTransform;

  /** Factory to produce `transform` function scoped to the given prefix. */
  transformer(options?: t.CssClassPrefix | t.StyleTransformerOptions): t.CssTransform;

  /** Transform margin spacing. */
  readonly toMargins: t.CssEdgesLib['toMargins'];
  /** Transform padding spacing. */
  readonly toPadding: t.CssEdgesLib['toPadding'];
  /** Transform shadding settings. */
  readonly toShadow: CssToShadow;

  /** Convert a {style} props object to a CSS string. */
  toString(style?: t.CssValue): string;
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
 * Standard CSS properties with CSS-template extensions.
 */
export type CssValue = t.CssProps & t.CssPseudo & t.CssTemplates;
export type CssInput = t.CssValue | undefined | null | false | never | CssTransformed | CssInput[];

/**
 * Function that transforms 1..n CSS inputs into a style
 * object that can be applied to a JSX element.
 *
 * NB: This is the raw transform containing the style along with cache metadata.
 */
export type CssTransform = (...input: t.CssInput[]) => t.CssTransformed;

/**
 * A transformed CSS properties object.
 */
export type CssTransformed = {
  /** The hash of the style (used for caching). */
  readonly hx: number;

  /** Style properties. */
  readonly style: t.CssProps;

  /** The CSS class-name. */
  readonly class: t.CssClassname;

  /** Convert the {style} props object to a CSS string. */
  toString(kind?: t.CssTransformStringKind): string;
};

/** Flags indicating the kind of string to export from the `toString` method. */
export type CssTransformStringKind = 'CssRule' | 'CssSelector';

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
