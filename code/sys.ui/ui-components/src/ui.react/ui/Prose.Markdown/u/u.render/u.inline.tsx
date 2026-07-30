import { Is, Markdown, type t } from '../../common.ts';
import { toSafeHref } from '../u.href.ts';
import type { MarkdownNodeRecord } from '../u.node.ts';

type InlineCodeRenderArgs = {
  node: t.ProseMarkdown.Inline.Code.Node;
  renderer?: t.ProseMarkdown.Inline.Code.Renderer;
  style: t.Style.Transform.Result;
};

type LinkRenderArgs = {
  node: MarkdownNodeRecord;
  children: t.ReactNode;
  renderer?: t.ProseMarkdown.Inline.Link.Renderer;
  style: t.Style.Transform.Result;
};

export function renderInlineCode(args: InlineCodeRenderArgs): t.ReactNode {
  const { node, renderer, style } = args;

  return renderer?.({ node, value: node.value }) ?? (
    <code className={style.class}>{node.value}</code>
  );
}

export function renderLink(args: LinkRenderArgs): t.ReactNode {
  const { node, children, renderer, style } = args;
  if (!Markdown.Is.link(node)) return children;

  const href = toSafeHref(node.url);
  const title = Is.string(node.title) && node.title.trim() ? node.title : undefined;
  if (!href) return children;

  return renderer?.({ node, href, title, children }) ?? (
    <a className={style.class} href={href} title={title}>{children}</a>
  );
}
