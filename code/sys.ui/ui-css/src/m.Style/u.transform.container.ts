import { type t } from './common.ts';

/**
 * Factory for creating the CSS @container convenience method
 * for the `CssTransformer` API.
 */
export function createTransformContainer(args: {
  sheet: t.CssDomStylesheet;
  className: string;
  condition: string;
  name?: string;
  style?: t.CssProps;
}): t.CssTransformContainerBlock {
  const { sheet, name, condition } = args;
  const container = name ? sheet.container(name, condition) : sheet.container(condition);
  const block = container.scope(`.${args.className}`);

  const api: t.CssTransformContainerBlock = {
    block,

    rule(selector, style) {
      return block.rules.add(selector, style);
    },

    css(style) {
      block.rules.add('', style);
      return api;
    },
  };

  if (args.style) api.css(args.style);
  return api;
}
