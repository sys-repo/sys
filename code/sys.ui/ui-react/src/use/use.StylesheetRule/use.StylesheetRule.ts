import { useInsertionEffect } from 'react';
import { Style, type t } from '../common.ts';

/**
 * Register current declarations on every committed render, before layout-effect setup.
 * Rules are additive and substrate-deduplicated, not replaced, reordered, or removed on unmount.
 * Inputs must remain stable through commit; server/discarded renders register nothing.
 */
export const useStylesheetRule: t.UseStylesheetRule = (selector, style, options) => {
  useInsertionEffect(() => {
    Style.Dom.stylesheet().rule(selector, style, options);
  });
};
