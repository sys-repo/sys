import { defaultTreeAdapter, html, Is as IsBase, type t } from './common.ts';

/**
 * Guards for trusted default-tree nodes, not arbitrary objects or browser DOM nodes.
 */
export const Is: t.Html.IsLib = Object.freeze({
  element(node): node is t.Html.Element {
    return !IsBase.nil(node) && defaultTreeAdapter.isElementNode(node);
  },
  template(node): node is t.Html.Template {
    return Is.element(node) && node.namespaceURI === html.NS.HTML && node.tagName === 'template';
  },
});
