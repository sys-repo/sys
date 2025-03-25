import { type t } from './common.ts';

/**
 * Factory for creating the CSS @container convenience method
 * for the `CssTransformer` API.
 */
export function createTransformContainer(
  block: t.CssDomContainerBlock,
  style?: t.CssProps,
): t.CssTransformContainerBlock {
  const api: t.CssTransformContainerBlock = {
    block,

    rule(selector, style) {
      return block.rules.add(selector, style);
    },

    css(style) {
      block.rules.add('', style);
      return api;
    },

    nest(selector) {
      return createTransformContainer(block.scope(selector));
    },
  };

  if (style) api.css(style);
  return api;
}
