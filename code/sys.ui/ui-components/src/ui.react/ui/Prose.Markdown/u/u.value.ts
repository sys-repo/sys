import { Is, Markdown as MarkdownBase, type t } from '../common.ts';

export type ResolvedValue =
  | { readonly kind: 'markdown'; readonly markdown: t.StringMarkdown }
  | { readonly kind: 'ast'; readonly ast: t.Markdown.Ast }
  | ValueError;

export type ResolvedAst = { readonly kind: 'ast'; readonly ast: t.Markdown.Ast } | ValueError;
export type ValueError = { readonly kind: 'error'; readonly error: string };

export const MarkdownValue = {
  resolve,
  toAst,
} as const;

function resolve(value: unknown): ResolvedValue {
  if (value === undefined) return { kind: 'markdown', markdown: '' };
  if (Is.string(value)) return { kind: 'markdown', markdown: value };
  if (MarkdownBase.Is.ast(value)) return { kind: 'ast', ast: value };
  return {
    kind: 'error',
    error: Is.record(value) ? 'Invalid Markdown AST.' : 'Invalid Markdown value.',
  };
}

function toAst(value: unknown): ResolvedAst {
  const input = resolve(value);
  if (input.kind !== 'markdown') return input;

  const result = MarkdownBase.parse(input.markdown);
  return result.error
    ? { kind: 'error', error: result.error.message }
    : { kind: 'ast', ast: result.data };
}
