import { Markdown, type t } from '../common.ts';

type ThematicBreakRenderArgs = {
  node: t.ProseMarkdown.Block.ThematicBreak.Node;
  renderer?: t.ProseMarkdown.Block.ThematicBreak.Renderer;
  source?: t.StringMarkdown;
};

export function renderThematicBreak(args: ThematicBreakRenderArgs): t.ReactNode {
  const { node, renderer, source } = args;
  const lexeme = source === undefined ? undefined : Markdown.Source.thematicBreak(source, node);
  return renderer?.({ node, lexeme }) ?? <hr />;
}
