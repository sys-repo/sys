import type { CSSObject } from '@emotion/react';
import type { t } from './common.ts';

export type { CSSObject };
export type CssInput = t.CssValue | undefined | null | false | never | CssInput[];

/**
 * Standard CSS properties with CSS-template extensions.
 */
export type CssValue = t.CSSObject & t.CssTemplates;

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
};
