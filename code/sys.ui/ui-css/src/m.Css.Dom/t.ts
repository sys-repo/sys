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
   * Inserts CSS styles with an arbitrary CSS-selector.
   * Use this for custom/complex CSS rules
   * (typically lean on the `CssDom.class` method).
   */
  rule(selector: string, style: t.CssProps): void;

  /**
   * Retrieve the singleton instance of the classes API
   * with the given classname "prefix".
   */
  classes(prefix?: string): t.CssDomClasses;

  /**
   * Retrieve the singleton instance of the "context block" API
   * for specifying style rules within a specific context.
   */
  context(kind: t.CssDomContextBlock['kind'], condition: string): t.CssDomContextBlock;
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

/**
 * Represents a CSS/DOM context block that encapsulates a set of CSS rules
 * applied under a specific conditional context.
 *
 * This type abstracts CSS at-rules that create scoped styling contexts,
 * such as:
 *
 *   - `@container`: Container queries for component-based responsiveness.
 *   - `@media`: Media queries based on viewport conditions.
 *   - `@supports`: Feature queries that check for CSS property support.
 *   - `@scope`: Scoped styling for a specific DOM subtree (experimental).
 *
 */
export type CssDomContextBlock = {
  /** The type of the context block. */
  readonly kind: '@container' | '@media' | '@supports' | '@scope';

  /** The conditional rules for the context block, eg "min-width: 700px". */
  readonly condition: string;
};
