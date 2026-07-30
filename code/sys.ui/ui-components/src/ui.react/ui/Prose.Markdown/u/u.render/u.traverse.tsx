import React from 'react';
import { Is, Markdown, type t } from '../../common.ts';
import { hasRenderableChildren, isMarkdownNodeRecord, type MarkdownNodeRecord } from '../u.node.ts';
import type { NotImplementedReason, RenderContext } from './t.ts';
import { renderCodeBlock } from './u.code-block.tsx';
import { renderHeading } from './u.heading.tsx';
import { renderInlineCode, renderLink } from './u.inline.tsx';
import { renderList, renderListItem } from './u.list.tsx';
import { renderThematicBreak } from './u.thematic-break.tsx';
import { NotImplemented } from './ui.NotImplemented.tsx';

export function renderChildren(
  children: readonly unknown[],
  ctx: RenderContext,
): readonly t.ReactNode[] {
  return children.map((node, index) => {
    return <React.Fragment key={index}>{renderNode(node, ctx)}</React.Fragment>;
  });
}

function renderNode(input: unknown, ctx: RenderContext): t.ReactNode {
  if (!isMarkdownNodeRecord(input)) return renderFallback(undefined, ctx, 'invalid');

  const node = input;
  const { renderers, styles } = ctx;

  switch (node.type) {
    case 'root':
      return hasRenderableChildren(node)
        ? renderContainerChildren(node, ctx)
        : renderFallback(node, ctx, 'invalid');
    case 'paragraph':
      return hasRenderableChildren(node)
        ? <p className={styles.paragraph.class}>{renderContainerChildren(node, ctx)}</p>
        : renderFallback(node, ctx, 'invalid');
    case 'code':
      return Markdown.Is.code(node)
        ? renderCodeBlock({ node, renderer: renderers?.codeBlock, style: styles.codeBlock })
        : renderFallback(node, ctx, 'invalid');
    case 'heading':
      return Markdown.Is.heading(node)
        ? renderHeading({
          node,
          children: renderContainerChildren(node, ctx),
          renderer: renderers?.heading,
          style: styles.heading,
        })
        : renderFallback(node, ctx, 'invalid');
    case 'thematicBreak':
      return Markdown.Is.thematicBreak(node)
        ? renderThematicBreak({ node, renderer: renderers?.thematicBreak, source: ctx.source })
        : renderFallback(node, ctx, 'invalid');
    case 'text':
      return Is.string(node.value) ? node.value : renderFallback(node, ctx, 'invalid');
    case 'inlineCode':
      return Markdown.Is.inlineCode(node)
        ? renderInlineCode({
          node,
          renderer: renderers?.inlineCode,
          style: styles.inlineCode,
        })
        : renderFallback(node, ctx, 'invalid');
    case 'strong':
      return hasRenderableChildren(node)
        ? <strong className={styles.strong.class}>{renderContainerChildren(node, ctx)}</strong>
        : renderFallback(node, ctx, 'invalid');
    case 'emphasis':
      return hasRenderableChildren(node)
        ? <em className={styles.emphasis.class}>{renderContainerChildren(node, ctx)}</em>
        : renderFallback(node, ctx, 'invalid');
    case 'link':
      return Markdown.Is.link(node)
        ? renderLink({
          node,
          children: renderContainerChildren(node, ctx),
          renderer: renderers?.link,
          style: styles.link,
        })
        : renderFallback(node, ctx, 'invalid');
    case 'list':
      return hasRenderableChildren(node)
        ? renderList({
          node,
          children: renderContainerChildren(node, ctx),
          style: styles.list,
        })
        : renderFallback(node, ctx, 'invalid');
    case 'listItem':
      return hasRenderableChildren(node)
        ? renderListItem({
          node,
          children: renderContainerChildren(node, ctx),
          renderer: renderers?.taskState,
          styles,
        })
        : renderFallback(node, ctx, 'invalid');
    case 'break':
      return <br />;
    default:
      return renderFallback(node, ctx, 'unsupported');
  }
}

function renderContainerChildren(
  node: MarkdownNodeRecord,
  ctx: RenderContext,
): readonly t.ReactNode[] {
  return hasRenderableChildren(node) ? renderChildren(node.children, ctx) : [];
}

function renderFallback(
  node: MarkdownNodeRecord | undefined,
  ctx: RenderContext,
  reason: NotImplementedReason,
): t.ReactNode {
  const children = node && hasRenderableChildren(node)
    ? renderChildren(node.children, ctx)
    : undefined;

  return (
    <NotImplemented nodeType={node?.type ?? 'unknown'} reason={reason}>
      {children}
    </NotImplemented>
  );
}
