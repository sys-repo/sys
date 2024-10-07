import type { t } from './common.ts';
export type * from './t.CssValue.ts';

type N = number | string | null | undefined;

/**
 * Library: CSS tools.
 */
export type StyleLib = {
  readonly Tmpl: t.StyleTmplLib;
  css: t.CssTransformer;
  plugin: StylePuginLib;
};

export type StylePuginLib = {
  /**
   * Default options for the SWC React plugin that enables
   * the CSS-in-JS tooling.
   * https://emotion.sh/
   */
  emotion(): t.ReactPluginOptions;
};

/**
 * Helpers for working with the [CssTemplates] DSL.
 */
export type StyleTmplLib = {
  /**
   * Apply common CSS templates (desiganted by capital letter field names)
   * converting the object into standard [CssProperties].
   *
   * For example: { Absolute: 0 }
   */
  transform(input?: t.CssValue | t.Falsy): t.CSSObject;

  /**
   * Convert a sloppy input into an {edges} property object
   * Input:
   *  - single value (eg. 0 or '5em')
   *  - 4-part array (eg. [10, null, 0, 5])
   *  - Y/X array    (eg. [20, 5])
   */
  toEdges(
    input?: t.CssEdgesInput | t.Falsy,
    override?: (edge: keyof t.CssEdges, value?: N) => N,
  ): Partial<t.CssEdges>;
};

/**
 * Options passed to [@vitejs/plugin-react-swc].
 */
export type ReactPluginOptions = {
  jsxImportSource: string;
  plugins: [string, Record<string, any>][];
};

/**
 * A spreadable object to apply to a React element,
 * for example:
 *   const styles = { base: css({ color: 'red' }) };
 *   <div {...style.base} />
 */
export type ReactCssObject = {
  /* Style property passed to react. */
  css: t.SerializedStyles;
};

/**
 * Function that transforms 1..n CSS inputs into a style
 * object that can be applied to a React element.
 */
export type CssTransformer = (...input: t.CssInput[]) => t.ReactCssObject;
