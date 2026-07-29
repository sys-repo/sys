import { Is, Markdown, type t } from '../common.ts';
import { toSafeHref } from './u.href.ts';
import type { MarkdownNodeRecord } from './u.node.ts';
import type { MarkdownStyles } from './u.styles.ts';

type InlineRenderContext = {
  readonly renderers?: t.ProseMarkdown.Renderers;
  readonly styles: MarkdownStyles;
};

type InlineCodeRenderArgs = InlineRenderContext & {
  readonly node: t.ProseMarkdown.Inline.Code.Node;
};

type LinkRenderArgs = InlineRenderContext & {
  readonly node: MarkdownNodeRecord;
  readonly children: t.ReactNode;
};

export function renderInlineCode(args: InlineCodeRenderArgs) {
  const { node, renderers, styles } = args;

  return renderers?.inlineCode?.({ node, value: node.value }) ?? (
    <code className={styles.inlineCode.class}>{node.value}</code>
  );
}

export function renderLink(args: LinkRenderArgs) {
  const { node, children, renderers, styles } = args;
  if (!Markdown.Is.link(node)) return children;

  const href = toSafeHref(node.url);
  const title = Is.string(node.title) && node.title.trim() ? node.title : undefined;
  if (!href) return children;

  return renderers?.link?.({ node, href, title, children }) ?? (
    <a className={styles.link.class} href={href} title={title}>{children}</a>
  );
}
