import { type t } from './common.ts';

/**
 * Factory for creating the CSS @container convenience method
 * for the `CssTransformer` API.
 */
export function createTransformContainer(
  base: t.Style.Transform.Result,
  block: t.CssDom.Container.Block,
  style?: t.Style.Props | undefined,
): t.Style.Transform.ContainerBlock {
  const api: t.Style.Transform.ContainerBlock = {
    block,

    container: base.container,
    rule: (selector, style) => block.rules.add(selector, style),
    nest: (selector) => createTransformContainer(base, block.scope(selector)),

    css(style) {
      block.rules.add('', style);
      return api;
    },

    get done() {
      return base;
    },
  };

  if (style) api.css(style);
  return api;
}
