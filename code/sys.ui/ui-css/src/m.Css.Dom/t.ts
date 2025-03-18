import type { t } from './common.ts';

/**
 * Tools for programatically managing CSS stylesheets within the browser DOM.
 */
export type CssDomLib = {
  /** Factory for a DOM <style> stylesheet element (singleton instances). */
  stylesheet(prefix?: string): t.CssDomStylesheet;

  /** Convert a {style} props object to a CSS string. */
  toString: t.StyleLib['toString'];
};

/**
 * A <style> DOM element used to store and manage CSS-classes
 * generated from CssProps
 */
export type CssDomStylesheet = {
  /** The root prefix applied to generated class-names. */
  readonly prefix: string;

  /** List of CSS class-names that have been inserted into the DOM.  */
  readonly classes: Readonly<string[]>;

  /**
   * Generates a CSS classname as the selector and inserts the given
   * {Style} object as a set of rules into the DOM (with caching).
   */
  class(style: t.CssProps, hx?: number): string;

  /**
   * Inserts CSS styles with an arbitrary CSS-selector.
   * Use this for custom/complex CSS rules
   * (typically lean on the `CssDom.class` method).
   */
  rule(selector: string, style: t.CssProps): void;
};
