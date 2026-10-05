import type { t } from '../common.ts';

type CodeBlockRenderArgs = {
  node: t.ProseMarkdown.Block.Code.Node;
  renderer?: t.ProseMarkdown.Block.Code.Renderer;
  style: t.Style.Transform.Result;
};

export function renderCodeBlock(args: CodeBlockRenderArgs): t.ReactNode {
  const { node, renderer, style } = args;
  const rendererArgs: t.ProseMarkdown.Block.Code.RendererArgs = {
    node,
    value: node.value,
    lang: node.lang ?? undefined,
    meta: node.meta ?? undefined,
  };
  return renderer?.(rendererArgs) ?? (
    <pre className={style.class}>
      <code>{node.value}</code>
    </pre>
  );
}
