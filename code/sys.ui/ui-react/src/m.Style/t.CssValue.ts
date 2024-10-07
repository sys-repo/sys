import type { t } from './common.ts';

/**
 * CSS Value
 */
export type CssTemplates = {
  Absolute?: [];
};

export type CssValue = t.CssProperties & t.CssTemplates;
