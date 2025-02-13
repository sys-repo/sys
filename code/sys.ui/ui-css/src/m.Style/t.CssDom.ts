import type { t } from './common.ts';

/**
 * Tools for programatically managing CSS stylesheets
 * within the browser DOM.
 */
export type CssDomLib = {
  /** Generator factory. */
  create(prefix?: string): t.CssDom;
};

/**
 * A <style> DOM element used to store and manage CSS-classes
 * generated from CssProps
 */
export type CssDom = {
  /** The root prefix applied to generated class-names. */
  readonly prefix: string;

  /** List of CSS class-names that have been inserted into the DOM.  */
  readonly classes: Readonly<string[]>;

  /** Generates a CSS class-name and inserts the given {Style} into the DOM. */
  insert(style: t.CssProps, hx?: number): string;
};
