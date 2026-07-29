import React from 'react';
import { Is, Markdown, type t } from '../common.ts';
import { hasRenderableChildren, isMarkdownNodeRecord, type MarkdownNodeRecord } from './u.node.ts';
import { renderInlineCode, renderLink } from './u.render.inline.tsx';
import { renderList, renderListItem } from './u.render.list.tsx';
import type { MarkdownStyles } from './u.styles.ts';

export type RenderContext = {
  readonly renderers?: t.ProseMarkdown.Renderers;
  readonly source?: t.StringMarkdown;
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
    case 'thematicBreak':
      return Markdown.Is.thematicBreak(node) ? renderThematicBreak(node, ctx) : null;
    case 'text':
      return Is.string(node.value) ? node.value : null;
    case 'inlineCode':
      return Markdown.Is.inlineCode(node) ? renderInlineCode({ ...ctx, node }) : null;
    case 'strong':
      return <strong className={styles.strong.class}>{renderContainerChildren(node, ctx)}</strong>;
    case 'emphasis':
      return <em className={styles.emphasis.class}>{renderContainerChildren(node, ctx)}</em>;
    case 'link':
      return renderLink({ ...ctx, node, children: renderContainerChildren(node, ctx) });
    case 'list':
      return renderList({ node, children: renderContainerChildren(node, ctx), styles });
    case 'listItem':
      return renderListItem({ ...ctx, node, children: renderContainerChildren(node, ctx) });
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

function renderThematicBreak(
  node: t.ProseMarkdown.Block.ThematicBreak.Node,
  ctx: RenderContext,
): t.ReactNode {
  const lexeme = ctx.source === undefined
    ? undefined
    : Markdown.Source.thematicBreak(ctx.source, node);
  return ctx.renderers?.thematicBreak?.({ node, lexeme }) ?? <hr />;
}
