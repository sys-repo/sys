import { Html, type t } from '../../mod.ts';

/** Require an element while arranging a parser fixture. */
export function element(node: t.Html.Node | undefined): t.Html.Element {
  if (!Html.Is.element(node)) throw new Error('expected element');
  return node;
}
