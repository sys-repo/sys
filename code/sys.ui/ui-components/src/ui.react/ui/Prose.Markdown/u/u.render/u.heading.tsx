import React from 'react';
import type { t } from '../../common.ts';

type HeadingRenderArgs = {
  node: t.ProseMarkdown.Block.Heading.Node;
  children: t.ReactNode;
  renderer?: t.ProseMarkdown.Block.Heading.Renderer;
  style: t.Style.Transform.Result;
};

export function renderHeading(args: HeadingRenderArgs): t.ReactNode {
  const { node, children, renderer, style } = args;
  const rendererArgs: t.ProseMarkdown.Block.Heading.RendererArgs = {
    node,
    depth: node.depth,
    children,
  };
  return renderer?.(rendererArgs) ??
    React.createElement(`h${node.depth}`, { className: style.class }, children);
}
