import { Err, hastSanitize, hastToHtml, Is, mdastToHast, type t } from './common.ts';
import { MarkdownIs } from '../m.Markdown/m.Is.ts';
import { parse } from '../m.Markdown/u/u.parse.ts';

export const render: t.Markdown.Html.Lib['render'] = (input = '', options) => {
  try {
    const ast = toAst(input, options);
    if (ast.error) return ast;

    const hast = mdastToHast(ast.data);
    const safe = hastSanitize(hast);
    const data = hastToHtml(safe) as t.Markdown.Html.StringHtml;

    return { data };
  } catch (cause) {
    return { error: Err.std('Failed to render Markdown HTML', { cause }) };
  }
};

function toAst(
  input: t.Markdown.Html.RenderInput,
  options?: t.Markdown.Html.RenderOptions,
): t.Markdown.ParseResult {
  if (MarkdownIs.ast(input)) return { data: input };
  if (Is.string(input)) return parse(input, { flavor: options?.flavor });

  const cause = Err.std('Expected Markdown source text or an MDAST root.');
  return { error: Err.std('Failed to render Markdown HTML', { cause }) };
}
