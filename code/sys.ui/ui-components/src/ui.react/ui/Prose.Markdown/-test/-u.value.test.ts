import { describe, expect, it, type t } from './common.ts';
import { MarkdownValue } from '../u/u.value.ts';

describe('Prose.Markdown: value resolver', () => {
  it('resolves undefined to empty Markdown source', () => {
    expect(MarkdownValue.resolve(undefined)).to.eql({ kind: 'markdown', markdown: '' });
  });

  it('resolves strings as Markdown source', () => {
    expect(MarkdownValue.resolve('Hello `token`.')).to.eql({
      kind: 'markdown',
      markdown: 'Hello `token`.',
    });
  });

  it('resolves Markdown AST objects directly', () => {
    const ast: t.Markdown.Ast = {
      type: 'root',
      children: [{ type: 'paragraph', children: [{ type: 'text', value: 'From AST.' }] }],
    };

    expect(MarkdownValue.resolve(ast)).to.eql({ kind: 'ast', ast });
    expect(MarkdownValue.toAst(ast)).to.eql({ kind: 'ast', ast });
  });

  it('parses Markdown source to AST', () => {
    const res = MarkdownValue.toAst('Hello.');

    expect(res.kind).to.eql('ast');
    if (res.kind === 'ast') {
      expect(res.ast.type).to.eql('root');
      expect(res.ast.children[0].type).to.eql('paragraph');
    }
  });

  it('reports malformed AST-shaped objects', () => {
    expect(MarkdownValue.resolve({ type: 'paragraph', children: [] })).to.eql({
      kind: 'error',
      error: 'Invalid Markdown AST.',
    });
  });

  it('reports non-value inputs', () => {
    expect(MarkdownValue.resolve(null)).to.eql({ kind: 'error', error: 'Invalid Markdown value.' });
  });
});
