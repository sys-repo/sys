import React from 'react';
import { Is, Markdown, type t } from '../../common.ts';
import { hasRenderableChildren, isMarkdownNodeRecord, type MarkdownNodeRecord } from '../u.node.ts';
import { renderCodeBlock } from './u.code-block.tsx';
import { renderHeading } from './u.heading.tsx';
import { renderInlineCode, renderLink } from './u.inline.tsx';
import { renderList, renderListItem } from './u.list.tsx';
import { renderThematicBreak } from './u.thematic-break.tsx';

type RenderContext = {
  renderers?: t.ProseMarkdown.Renderers;
  source?: t.StringMarkdown;
  styles: t.ProseMarkdown.Styles;
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
  const { renderers, styles } = ctx;

  switch (node.type) {
    case 'root':
      return renderContainerChildren(node, ctx);
    case 'paragraph':
      return <p className={styles.paragraph.class}>{renderContainerChildren(node, ctx)}</p>;
    case 'code':
      return Markdown.Is.code(node)
        ? renderCodeBlock({ node, renderer: renderers?.codeBlock, style: styles.codeBlock })
        : null;
    case 'heading':
      return Markdown.Is.heading(node)
        ? renderHeading({
          node,
          children: renderContainerChildren(node, ctx),
          renderer: renderers?.heading,
          style: styles.heading,
        })
        : renderContainerChildren(node, ctx);
    case 'thematicBreak':
      return Markdown.Is.thematicBreak(node)
        ? renderThematicBreak({ node, renderer: renderers?.thematicBreak, source: ctx.source })
        : null;
    case 'text':
      return Is.string(node.value) ? node.value : null;
    case 'inlineCode':
      return Markdown.Is.inlineCode(node)
        ? renderInlineCode({
          node,
          renderer: renderers?.inlineCode,
          style: styles.inlineCode,
        })
        : null;
    case 'strong':
      return <strong className={styles.strong.class}>{renderContainerChildren(node, ctx)}</strong>;
    case 'emphasis':
      return <em className={styles.emphasis.class}>{renderContainerChildren(node, ctx)}</em>;
    case 'link':
      return renderLink({
        node,
        children: renderContainerChildren(node, ctx),
        renderer: renderers?.link,
        style: styles.link,
      });
    case 'list':
      return renderList({
        node,
        children: renderContainerChildren(node, ctx),
        style: styles.list,
      });
    case 'listItem':
      return renderListItem({
        node,
        children: renderContainerChildren(node, ctx),
        renderer: renderers?.taskState,
        styles,
      });
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
