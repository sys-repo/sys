import type { Html } from '@sys/html/t';

/** Identical workload for the public Html entry and the direct-parse5 baseline. */
export function example(
  parseFragment: Html.ParseFragment,
  isElement: (node: Html.Node) => node is Html.Element,
) {
  const source = '<a href="/hello?x=1&amp;y=2">Hello</a>';
  const node = parseFragment(source, { sourceCodeLocationInfo: true }).childNodes[0];
  if (!node || !isElement(node)) throw new Error('expected anchor element');
  const href = node.attrs.find((attr) => attr.prefix === undefined && attr.name === 'href');
  const span = node.sourceCodeLocation?.attrs?.href;
  if (!href || !span) throw new Error('expected href and source span');
  return { value: href.value, spelling: source.slice(span.startOffset, span.endOffset) };
}
