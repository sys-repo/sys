import type { t } from './common.ts';

/** Flags indicating the kind of string to export from the `toString` method. */
export type ToStringKind = 'CssRule' | 'CssSelector';

/** Function that transforms CSS inputs into an applicable style object. */
export type Fn = (...input: t.Style.Input[]) => Result;

/** A transformed CSS properties object. */
export type Result = {
  /** The hash of the style (used for caching). */
  readonly hx: number;

  /** Style properties. */
  readonly style: t.Style.Props;

  /** The CSS class-name. */
  readonly class: t.Style.Classname;

  /** Convert the {style} props object to a CSS string. */
  toString(kind?: ToStringKind): string;

  /** Retrieve the @container API scoped to the current css-class. */
  container(condition: string, style?: t.Style.Value): ContainerBlock;
  container(name: string, condition: string, style?: t.Style.Value): ContainerBlock;

  /** Insert a CSS rule within scope with the current `class` name. */
  rule(selector: t.StringCssSelector, style: t.Style.Value | t.Style.Value[]): Result;
};

/** Specialized @container block API for the `Style.Transform.Fn` result. */
export type ContainerBlock = {
  /** The underlying @container block being used by the convenience API. */
  readonly block: t.CssDom.Container.Block;

  /** Insert a CSS rule within the @container context with the given arbitrary selector. */
  rule(
    selector: t.StringCssSelector,
    style: t.Style.Value | t.Style.Value[],
  ): t.CssDom.InsertedRule[];

  /** Insert a CSS rule within the @container directly under the CSS class-name scope. */
  css(style: t.Style.Value | t.Style.Value[]): ContainerBlock;

  /** Creates a new scoped sub-selector. */
  nest(selector: t.StringCssSelector): ContainerBlock;

  /** Generate a new @container block off the root transform for fluent chains. */
  container(condition: string, style?: t.Style.Value): ContainerBlock;
  container(name: string, condition: string, style?: t.Style.Value): ContainerBlock;

  /** Returns the root `Style.Transform.Result` used in ending a fluent chain. */
  readonly done: Result;
};
