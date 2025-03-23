import type { t } from './common.ts';

/**
 * Tools for programatically managing CSS stylesheets within the browser DOM.
 */
export type CssDomLib = {
  /** Factory for a DOM <style> stylesheet element (singleton instances). */
  stylesheet(options?: { instance?: string }): t.CssDomStylesheet;

  /** Convert a {style} props object to a CSS string. */
  toString: t.StyleLib['toString'];
};

/**
 * A <style> DOM element used to store and manage CSS-classes
 * generated from CssProps
 */
export type CssDomStylesheet = {
  readonly id: t.StringId;

  /**
   * Generates a CSS classname as the selector and inserts the given
   * {Style} object as a set of rules into the DOM (with caching).
   */
  classes(prefix?: string): CssDomClasses;

  /**
   * Inserts CSS styles with an arbitrary CSS-selector.
   * Use this for custom/complex CSS rules
   * (typically lean on the `CssDom.class` method).
   */
  rule(selector: string, style: t.CssProps): void;
};

/**
 * API for inserting CSS class-styes into a DOM's stylesheet.
 */
export type CssDomClasses = {
  /** The root prefix applied to generated class-names: "<prefix>-<hash>". */
  readonly prefix: string;

  /** List of CSS class-names that have been inserted into the DOM.  */
  readonly names: Readonly<string[]>;

  /**
   * Generates a CSS classname as the selector and inserts the given
   * {Style} object as a set of rules into the DOM (with caching).
   */
  add(style: t.CssProps, options?: { hx?: number }): string;
};

/**
 * API for inserting CSS rules into a DOM's stylesheet.
 */
export type CssDomRules = {
  /** List of CSS rules that have been inserted into the DOM.  */
  readonly rules: Readonly<string[]>;

  /**
   * Insert CSS style rule with an arbitrary selector.
   * @returns true if the rules was inserted, or false if it already existed.
   */
  add(selector: string, style: t.CssProps): void;
};
