import type { t } from './common.ts';

/** Flags indicating the kind of string to export from the `toString` method. */
export type CssTransformToStringKind = 'CssRule' | 'CssSelector';

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
  toString(kind?: t.CssTransformToStringKind): string;

  /**
   * Retrieve the @container API scoped to the current css-class.
   */
  container(condition: string, style?: t.CssProps): t.CssTransformContainerBlock;
  container(name: string, condition: string, style?: t.CssProps): t.CssTransformContainerBlock;
};

/**
 * A specialised @container block API with concenience
 * methods for the `CssTransform` functional object.
 */
export type CssTransformContainerBlock = {
  /** The underlying @container block being used by the convenience API. */
  readonly block: t.CssDomContainerBlock;

  /** Insert a CSS rule within the @container context with the given arbitrary selector. */
  rule(selector: t.StringCssSelector, style: t.CssProps | t.CssProps[]): t.CssDomInsertedRule[];

  /** Insert a CSS rule within the @container directly under the CSS class-name scope. */
  css(style: t.CssProps | t.CssProps[]): CssTransformContainerBlock;

  /** Creates a new scoped sub-selector. */
  nest(selector: t.StringCssSelector): CssTransformContainerBlock;
};
