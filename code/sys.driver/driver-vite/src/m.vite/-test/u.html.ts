import { Html } from '@sys/html';

/** Read emitted preload URLs without coupling evidence to attribute serialization order. */
export function extractModulePreloadLinks(html: string): string[] {
  const document = Html.parse(html);
  const matches: string[] = [];
  const visit = (nodes: typeof document.childNodes) => {
    for (const node of nodes) {
      if (!Html.Is.element(node) || Html.Is.template(node)) continue;
      const rel = node.attrs.find((attr) => attr.name === 'rel')?.value;
      const href = node.attrs.find((attr) => attr.name === 'href')?.value;
      if (node.tagName === 'link' && rel === 'modulepreload' && href?.startsWith('./pkg/')) {
        matches.push(href);
      }
      visit(node.childNodes);
    }
  };
  visit(document.childNodes);
  return matches;
}
