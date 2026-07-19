import React from 'react';
import { Is, Num, type t } from '../common.ts';
import { toSafeHref } from './u.href.ts';
import {
  hasRenderableChildren,
  isInlineCodeNode,
  isMarkdownNodeRecord,
  type MarkdownNodeRecord,
} from './u.node.ts';
import type { MarkdownStyles } from './u.styles.ts';

export type RenderContext = {
  readonly renderers?: t.ProseMarkdown.Renderers;
  readonly styles: MarkdownStyles;
};

export function renderChildren(
  children: readonly unknown[],
  ctx: RenderContext,
): readonly t.ReactNode[] {
  return children.map((node, index) => {
    return <React.Fragment key={index}>{renderNode(node, ctx)}</React.Fragment>;
  });
}

function renderNode(input: unknown, ctx: RenderContext): t.ReactNode {
  if (!isMarkdownNodeRecord(input)) return null;

  const node = input;
  const { styles } = ctx;

  switch (node.type) {
    case 'root':
      return renderContainerChildren(node, ctx);
    case 'paragraph':
      return <p className={styles.paragraph.class}>{renderContainerChildren(node, ctx)}</p>;
    case 'text':
      return isStringValue(node.value) ? node.value : null;
    case 'inlineCode':
      return isInlineCodeNode(node) ? renderInlineCode(node, ctx) : null;
    case 'strong':
      return <strong className={styles.strong.class}>{renderContainerChildren(node, ctx)}</strong>;
    case 'emphasis':
      return <em className={styles.emphasis.class}>{renderContainerChildren(node, ctx)}</em>;
    case 'link':
      return renderLink(node, ctx);
    case 'list':
      return renderList(node, ctx);
    case 'listItem':
      return <li className={styles.listItem.class}>{renderContainerChildren(node, ctx)}</li>;
    case 'break':
      return <br />;
    default:
      return hasRenderableChildren(node) ? renderChildren(node.children, ctx) : null;
  }
}

function renderContainerChildren(
  node: MarkdownNodeRecord,
  ctx: RenderContext,
): readonly t.ReactNode[] {
  return hasRenderableChildren(node) ? renderChildren(node.children, ctx) : [];
}

function renderInlineCode(node: t.ProseMarkdown.Inline.Code.Node, ctx: RenderContext) {
  const { renderers, styles } = ctx;
  return renderers?.inlineCode?.({ node, value: node.value }) ?? (
    <code className={styles.inlineCode.class}>{node.value}</code>
  );
}

function renderLink(node: MarkdownNodeRecord, ctx: RenderContext) {
  const { styles } = ctx;
  const children = renderContainerChildren(node, ctx);
  const href = toSafeHref(node.url);
  const title = isStringValue(node.title) && node.title.trim() ? node.title : undefined;

  return href
    ? <a className={styles.link.class} href={href} title={title}>{children}</a>
    : children;
}

function renderList(node: MarkdownNodeRecord, ctx: RenderContext) {
  const { styles } = ctx;
  const children = renderContainerChildren(node, ctx);
  const start = Num.Is.safeInt(node.start) ? node.start : undefined;

  return node.ordered === true
    ? <ol className={styles.list.class} start={start}>{children}</ol>
    : <ul className={styles.list.class}>{children}</ul>;
}

function isStringValue(input: unknown): input is string {
  return Is.string(input);
}
