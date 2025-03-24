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
  if (args.style) block.rules.add('', args.style);

  const api: t.CssTransformContainerBlock = {
    block,
  };
  return api;
}
