import type { t } from './common.ts';
export type * from './t.ctx.ts';

/**
 * Tools for programatically managing CSS stylesheets within the browser DOM.
 */
export type CssDomLib = {
  readonly PseudoClass: t.CssPseudoClassLib;

  /** Factory for a DOM <style> stylesheet element (singleton instances). */
  stylesheet(options?: CssDomStylesheetOptions | t.StringId): t.CssDomStylesheet;

  /** Convert a {style} props object to a CSS string. */
  toString: t.StyleLib['toString'];
};

/** Options passed to the `Style.Dom.stylesheet` method. */
export type CssDomStylesheetOptions = { instance?: t.StringId; classPrefix?: string };

/**
 * A <style> DOM element used to store and manage CSS-classes
 * generated from CssProps
 */
export type CssDomStylesheet = {
  readonly id: t.StringId;

  /**
   * Inserts CSS style rules into the stylesheet.
   * Accepts either a single style object or an array of style objects.
   * Optionally, a context string can be provided to wrap the rules.
   *
   * Example:
   *
   *   api.add(".card h2", { fontSize: "2em" }, { context: "@container (min-width: 700px)" });
   *
   *   // or multiple style objects:
   *   api.add(".card", [
   *     { color: "blue" },
   *     { margin: "1rem", ":hover": { color: "red" } }
   *   ], { context: "@media (min-width: 600px)" });
   */
  rule(
    selector: string,
    style: t.CssValue | t.CssValue[],
    options?: CssDomRuleOptions,
  ): CssDomInsertedRule[];
  /** Rules API. */
  readonly rules: t.CssDomRules;

  /**
   * Retrieve the singleton instance of the classes API
   * with the given classname "prefix".
   */
  classes(prefix?: string): t.CssDomClasses;

  /**
   * Retrieve the singleton instance of an @container API
   * for specifying style rules within a specific size container.
   */
  container(condition: string): t.CssDomContainerBlock;
  container(name: string, condition: string): t.CssDomContainerBlock;
};

/**
 * API for inserting CSS class-styes into a DOM's stylesheet.
 */
export type CssDomClasses = {
  /** The root prefix applied to generated class-names: "<prefix>-<hash>". */
  readonly prefix: string;

  /** List of CSS class-names that have been inserted into the DOM. */
  readonly names: Readonly<string[]>;

  /**
   * Generates a CSS classname as the selector and inserts the given
   * {Style} object as a set of rules into the DOM (with caching).
   */
  add(style: t.CssValue, options?: { hx?: number }): string;
};

/**
 * API for inserting CSS rules into a DOM's stylesheet.
 */
export type CssDomRules = {
  /** The total number of inserted rules. */
  readonly length: number;

  /** List of CSS rules that have been inserted into the DOM.  */
  readonly list: Readonly<CssDomInsertedRule[]>;

  /**
   * Inserts generic CSS style rules into the stylesheet.
   * Accepts either a single style object or an array of style objects.
   * Optionally, a context string can be provided to wrap the rules.
   *
   * Example:
   *
   *   api.add(".card h2", { fontSize: "2em" }, { context: "@container (min-width: 700px)" });
   *
   *   // or multiple style objects:
   *   api.add(".card", [
   *     { color: "blue" },
   *     { margin: "1rem", ":hover": { color: "red" } }
   *   ], { context: "@media (min-width: 600px)" });
   *
   * @returns true if inserted, or false if already inserted.
   */
  add(
    selector: string,
    style: t.CssValue | t.CssValue[],
    options?: CssDomRuleOptions,
  ): CssDomInsertedRule[];
};

/** Options passed to the rule insertion method. */
export type CssDomRuleOptions = { context?: string };

/** The receipt of a rule that has been inserted into the DOM. */
export type CssDomInsertedRule = {
  readonly selector: string;
  readonly style: t.CssProps;
  readonly rule: string;
};

import type { level3, level4 } from './m.CssPseudoClass.ts';

/**
 * CSS Pseudo-Classes (Levels 3 & 4).
 * Ref:
 *    https://www.w3.org/TR/selectors-3
 *    https://www.w3.org/TR/selectors-4
 */
export type CssPseudoClassLib = {
  level3: ReadonlySet<CssPseudoClassLevel3>;
  level4: ReadonlySet<CssPseudoClassLevel4>;
  all: ReadonlySet<CssPseudoClass>;
  isClass(input: unknown): input is CssPseudoClass;
};
export type CssPseudoClassLevel3 = (typeof level3)[number];
export type CssPseudoClassLevel4 = (typeof level4)[number];
export type CssPseudoClass = CssPseudoClassLevel3 | CssPseudoClassLevel4;
