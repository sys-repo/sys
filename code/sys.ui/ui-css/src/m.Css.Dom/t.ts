import type { t } from './common.ts';

/**
 * Tools for programatically managing CSS stylesheets within the browser DOM.
 */
export type CssDomLib = {
  /** Factory for a DOM <style> stylesheet element (singleton instances). */
  stylesheet(prefix?: string): t.CssDomStylesheet;
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

  /** Generates a CSS class-name and inserts the given {Style} into the DOM. */
  class(style: t.CssProps, hx?: number): string;
};
