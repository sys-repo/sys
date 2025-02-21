import type { t } from './common.ts';

/**
 * Helpers for working with the [CssTemplates] DSL.
 */
export type CssTmplLib = {
  /**
   * Apply common CSS templates (desiganted by capital letter field names)
   * converting the object into standard [CssProperties].
   *
   * For example: { Absolute: 0 }
   */
  transform(input?: t.CssValue | t.Falsy): t.CssProps;

  /**
   * Convert a sloppy input into an {edges} property object
   * Input:
   *  - single value (eg. 0 or '5em')
   *  - 4-part array (eg. [10, null, 0, 5])
   *  - Y/X array    (eg. [20, 5])
   */
  toEdges(input?: t.CssEdgesInput | t.Falsy, mutater?: t.CssEdgeMutater): t.CssProps;
};

/**
 * CSS Templates.
 *
 * These are CSS template-names disambiguated from other
 * css properties by being capitalied.
 *
 * A template is used to transform common CSS operations into
 * their proper CSS equivalent.
 */
export type CssTemplates = {
  Absolute?: t.CssEdgesInput;
  Margin?: t.CssEdgesInput;
  MarginX?: t.CssEdgesXYInput;
  MarginY?: t.CssEdgesXYInput;
  Padding?: t.CssEdgesInput;
  PaddingX?: t.CssEdgesXYInput;
  PaddingY?: t.CssEdgesXYInput;
  Size?: number | string | [number | string, number | string] | t.Falsy;
  Scroll?: boolean;
};
