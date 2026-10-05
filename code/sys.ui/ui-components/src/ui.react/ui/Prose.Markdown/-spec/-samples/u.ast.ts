import { Markdown, Str, type t } from '../common.ts';

const SOURCE = Str.dedent(`
  This sample is an MDAST object parsed by \`@sys/markdown\` before it reaches the renderer.

  - The debug state stores \`t.Markdown.Value\`.
  - Strings and ASTs use the same \`Prose.Markdown.UI\` value prop.
`);

export const ast = {
  label: 'sample: parsed AST',
  value: toAst(SOURCE),
} as const;

function toAst(source: t.StringMarkdown): t.Markdown.Ast {
  const res = Markdown.parse(source);
  if (res.error) throw new Error(res.error.message);
  return res.data;
}
